"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isLoggedIn: boolean
  userRole: string | null
  userId: string | null
  login: (token: string, userId: string, role: string, refreshToken?: string) => void
  logout: (redirectToLogin?: boolean) => void
  isLoading: boolean
  checkAuth: () => { authenticated: boolean; role: string | null; userId: string | null }
  refreshAccessToken: () => Promise<boolean>
  forceLogout: (reason?: string) => void
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  userId: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  checkAuth: () => ({ authenticated: false, role: null, userId: null }),
  refreshAccessToken: async () => false,
  forceLogout: () => {},
})

// Session inactivity timeout (15 minutes)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000

// Helper function to decode JWT and get expiration time
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

// Helper function to check if token is expired or about to expire
const isTokenExpiredOrExpiring = (token: string, bufferMs: number = 60000): boolean => {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  return Date.now() >= expiration - bufferMs
}

// Get login page for a specific role
const getLoginPageForRole = (role: string | null): string => {
  switch (role) {
    case "buyer":
      return "/buyer/login"
    case "seller":
      return "/seller/login"
    case "admin":
      return "/admin/login"
    default:
      return "/member-login"
  }
}

// CRITICAL: Use ONLY sessionStorage for all auth data
// This ensures sessions are tab-specific and cleared on tab close
const clearAuthStorage = (role?: string | null) => {
  if (typeof window === "undefined") return
  
  // Clear current session
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("refreshToken")
  sessionStorage.removeItem("userId")
  sessionStorage.removeItem("userRole")
  
  // Clear legacy localStorage (cleanup)
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("userId")
  localStorage.removeItem("userRole")
  
  // Clear role-specific keys if role provided
  if (role) {
    const keys = ['token', 'refreshToken', 'userId', 'userRole']
    keys.forEach(key => {
      sessionStorage.removeItem(`${role}_${key}`)
      localStorage.removeItem(`${role}_${key}`)
    })
  }
}

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)
  const lastActivityRef = useRef<number>(Date.now())

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

  // Force logout - used when auth errors occur
  const forceLogout = useCallback((reason?: string) => {
    if (typeof window === "undefined") return
    
    const currentRole = userRole || sessionStorage.getItem("userRole")

    // Clear timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }

    // Clear all auth storage
    clearAuthStorage(currentRole)

    // Update state
    setIsLoggedIn(false)
    setUserId(null)
    setUserRole(null)

    // Redirect to appropriate login page
    const loginPage = getLoginPageForRole(currentRole)

    router.push(loginPage)
  }, [userRole, router])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    if (isLoggedIn) {
      inactivityTimeoutRef.current = setTimeout(() => {
        forceLogout("Session expired due to inactivity")
      }, INACTIVITY_TIMEOUT)
    }
  }, [isLoggedIn, forceLogout])

  // Function to refresh the access token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false
    
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return false
    }

    const refreshToken = sessionStorage.getItem("refreshToken")
    if (!refreshToken) {
      return false
    }

    isRefreshingRef.current = true

    try {
      const response = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        isRefreshingRef.current = false
        return false
      }

      const data = await response.json()

      // Store new tokens in sessionStorage ONLY
      sessionStorage.setItem("token", data.access_token)
      if (data.refresh_token) {
        sessionStorage.setItem("refreshToken", data.refresh_token)
      }

      // Schedule next refresh
      scheduleTokenRefresh(data.access_token)

      isRefreshingRef.current = false
      return true
    } catch (error) {
      isRefreshingRef.current = false
      return false
    }
  }, [])

  // Schedule automatic token refresh
  const scheduleTokenRefresh = useCallback((token: string) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const expiration = getTokenExpiration(token)
    if (!expiration) return

    // Refresh 2 minutes before expiry
    const refreshTime = expiration - Date.now() - 2 * 60 * 1000

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        const success = await refreshAccessToken()
        if (!success) {
          forceLogout("Token refresh failed")
        }
      }, refreshTime)
    } else {
      // Token is already expired or about to expire
      refreshAccessToken().then(success => {
        if (!success) {
          forceLogout("Token expired")
        }
      })
    }
  }, [refreshAccessToken, forceLogout])

  // Check if user is logged in on initial load
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }
      
      try {
        // Check sessionStorage ONLY for current session
        const token = sessionStorage.getItem("token")
        const storedUserId = sessionStorage.getItem("userId")
        const storedUserRole = sessionStorage.getItem("userRole")
        const refreshToken = sessionStorage.getItem("refreshToken")

        if (token && storedUserId && storedUserRole) {
          // Check if access token is expired or about to expire
          if (isTokenExpiredOrExpiring(token)) {
            if (refreshToken) {
              const refreshed = await refreshAccessToken()
              if (refreshed) {
                setIsLoggedIn(true)
                setUserId(storedUserId)
                setUserRole(storedUserRole)
              } else {
                // Refresh failed, clear auth state
                clearAuthStorage(storedUserRole)
                setIsLoggedIn(false)
                setUserId(null)
                setUserRole(null)
              }
            } else {
              // No refresh token, clear auth state
              clearAuthStorage(storedUserRole)
              setIsLoggedIn(false)
              setUserId(null)
              setUserRole(null)
            }
          } else {
            // Token is still valid
            setIsLoggedIn(true)
            setUserId(storedUserId)
            setUserRole(storedUserRole)
            // Schedule token refresh
            scheduleTokenRefresh(token)
          }
        } else {
          setIsLoggedIn(false)
          setUserId(null)
          setUserRole(null)
        }
      } catch (error) {
        setIsLoggedIn(false)
        setUserId(null)
        setUserRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Cleanup timeout on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [refreshAccessToken, scheduleTokenRefresh])

  // Setup inactivity detection
  useEffect(() => {
    if (!isLoggedIn) return

    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Start inactivity timer
    resetInactivityTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [isLoggedIn, resetInactivityTimer])

  // Handle visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        // Check if session is still valid when tab becomes visible
        const token = sessionStorage.getItem("token")
        if (!token) {
          // Session was cleared
          forceLogout("Session ended")
        } else if (isTokenExpiredOrExpiring(token, 0)) {
          // Token expired while tab was inactive
          refreshAccessToken().then(success => {
            if (!success) {
              forceLogout("Session expired")
            }
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isLoggedIn, forceLogout, refreshAccessToken])

  const login = (token: string, newUserId: string, role: string, refreshToken?: string) => {
    if (typeof window === "undefined") return
    
    try {
      // Clean the token
      const cleanToken = token.trim()

      // Store in sessionStorage ONLY
      sessionStorage.setItem("token", cleanToken)
      sessionStorage.setItem("userId", newUserId)
      sessionStorage.setItem("userRole", role)

      // Store refresh token if provided
      if (refreshToken) {
        const cleanRefreshToken = refreshToken.trim()
        sessionStorage.setItem("refreshToken", cleanRefreshToken)
      }

      setIsLoggedIn(true)
      setUserId(newUserId)
      setUserRole(role)

      // Schedule token refresh
      scheduleTokenRefresh(cleanToken)

      // Reset inactivity timer
      resetInactivityTimer()
    } catch (error) {
      // Error during login
    }
  }

  const logout = useCallback((redirectToLogin: boolean = true) => {
    if (typeof window === "undefined") return
    
    try {
      // Get current role before clearing
      const currentRole = userRole || sessionStorage.getItem("userRole")

      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }

      // Clear inactivity timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }

      // Clear all auth storage
      clearAuthStorage(currentRole)

      setIsLoggedIn(false)
      setUserId(null)
      setUserRole(null)

      if (redirectToLogin) {
        const loginPage = getLoginPageForRole(currentRole)
        router.push(loginPage)
      }
    } catch (error) {
      // Error during logout
    }
  }, [userRole, router])

  const checkAuth = useCallback(() => {
    if (typeof window === "undefined") {
      return { authenticated: false, role: null, userId: null }
    }
    
    try {
      const token = sessionStorage.getItem("token")
      const storedUserId = sessionStorage.getItem("userId")
      const role = sessionStorage.getItem("userRole")

      if (!token) {
        return { authenticated: false, role: null, userId: null }
      }

      // Check if token is expired
      if (isTokenExpiredOrExpiring(token, 0)) {
        return { authenticated: false, role: null, userId: null }
      }

      return {
        authenticated: true,
        role: role || null,
        userId: storedUserId || null,
      }
    } catch (error) {
      return { authenticated: false, role: null, userId: null }
    }
  }, [])

  const value = {
    isLoggedIn,
    userRole,
    userId,
    login,
    logout,
    isLoading,
    checkAuth,
    refreshAccessToken,
    forceLogout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
