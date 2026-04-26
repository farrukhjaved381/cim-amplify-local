import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

// Get API URL with fallback and validation
const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return "https://cim-backend.vercel.app" // Default local backend URL
  }
  return apiUrl
}

// Helper to get token from storage (sessionStorage ONLY - no localStorage)
const getToken = () => {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("token")
}

// Helper to get refresh token from storage
const getRefreshToken = () => {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("refreshToken")
}

// Helper to get user role from storage
const getUserRole = () => {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("userRole")
}

// Helper to clear all auth storage
const clearAuthStorage = () => {
  if (typeof window === "undefined") return
  // Clear sessionStorage
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("refreshToken")
  sessionStorage.removeItem("userId")
  sessionStorage.removeItem("userRole")
  // Clear localStorage (legacy cleanup)
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("userId")
  localStorage.removeItem("userRole")
}

// Helper to set auth in sessionStorage ONLY
const setAuthStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return
  sessionStorage.setItem(key, value)
}

// Helper to get login page for a role
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

// Helper to redirect to login on auth failure
const redirectToLogin = () => {
  if (typeof window === "undefined") return
  const role = getUserRole()
  clearAuthStorage()
  const loginPage = getLoginPageForRole(role)
  window.location.href = loginPage
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor for token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Improve error messages for better user experience
    if (error.response?.status === 401) {
      // Check if this is a login request
      const isLoginRequest = originalRequest.url?.includes('/login') || originalRequest.url?.includes('/auth')

      if (isLoginRequest && !originalRequest._retry) {
        // For login requests, preserve the backend error message or use a user-friendly default
        const backendMessage = (error.response.data as any)?.message
        if (backendMessage) {
          error.message = backendMessage
        } else {
          error.message = "Invalid email or password. Please check your credentials and try again."
        }
        return Promise.reject(error)
      }
    }

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this is already a refresh request
      if (originalRequest.url?.includes('/auth/refresh')) {
        clearAuthStorage()
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        // No refresh token, clear auth and redirect to login
        clearAuthStorage()
        isRefreshing = false
        redirectToLogin()
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${getApiUrl()}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token: newRefreshToken } = response.data

        // Store new tokens in sessionStorage ONLY
        setAuthStorage("token", access_token)
        if (newRefreshToken) {
          setAuthStorage("refreshToken", newRefreshToken)
        }

        // Update authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`

        // Process queued requests
        processQueue(null, access_token)

        isRefreshing = false

        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        processQueue(refreshError as Error, null)
        clearAuthStorage()
        isRefreshing = false
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Seller API functions
export const sellerLogin = async (credentials: { email: string; password: string }) => {
  const response = await api.post("/auth/seller/login", {
    ...credentials,
    userType: "seller",
  })
  const { access_token, refresh_token, user } = response.data
  if (access_token) {
    setAuthStorage("token", access_token)
    setAuthStorage("userRole", "seller")
  }
  if (refresh_token) {
    setAuthStorage("refreshToken", refresh_token)
  }
  if (user?.id) {
    setAuthStorage("userId", user.id)
  }
  return response.data
}

export const sellerRegister = async (userData: {
  fullName: string
  email: string
  password: string
  companyName: string
  title?: string
  phoneNumber?: string
  website?: string
  referralSource?: string
  signUpForSms?: boolean
}) => {
  const response = await api.post("/sellers/register", userData)
  return response.data
}

export const adminLogin = async (credentials: { email: string; password: string }) => {
  const response = await api.post("/auth/admin/login", {
    ...credentials,
    userType: "admin",
  });
  const { access_token, refresh_token, user } = response.data;
  if (access_token) {
    setAuthStorage("token", access_token);
    setAuthStorage("userRole", "admin");
  }
  if (refresh_token) {
    setAuthStorage("refreshToken", refresh_token);
  }
  if (user?.id) {
    setAuthStorage("userId", user.id);
  }
  return {
    token: access_token,
    refresh_token,
    userId: user.id,
    userRole: user.role,
    userEmail: user.email,
    userFullName: user.fullName
  };
};

export const submitDeal = async (dealData: any) => {
  const response = await api.post("/deals", dealData)
  return response.data
}

export const getMyDeals = async () => {
  const response = await api.get("/deals/my-deals")
  return response.data
}

export const getSellerProfile = async () => {
  const response = await api.get("/sellers/profile")
  return response.data
}

export const getMatchingBuyers = async (dealId: string) => {
  const response = await api.get(`/deals/${dealId}/matching-buyers`)
  return response.data
}

export const targetDealToBuyers = async (dealId: string, buyerIds: string[]) => {
  const response = await api.post(`/deals/${dealId}/target-buyers`, { buyerIds })
  return response.data
}

export const getDealById = async (dealId: string) => {
  const response = await api.get(`/deals/${dealId}`)
  return response.data
}

// Buyer API functions
export const register = async (userData: {
  fullName: string
  email: string
  password: string
  companyName: string
  phone: string
  website: string
  referralSource?: string
  signUpForSms?: boolean
}) => {
  const response = await api.post("/buyers/register", userData)
  return response.data
}

export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post("/auth/login", credentials)
  const { access_token, refresh_token, user } = response.data
  if (access_token) {
    setAuthStorage("token", access_token)
    setAuthStorage("userRole", "buyer")
  }
  if (refresh_token) {
    setAuthStorage("refreshToken", refresh_token)
  }
  if (user?.id) {
    setAuthStorage("userId", user.id)
  }
  return { token: access_token, refreshToken: refresh_token, userId: user.id }
}

export const logout = () => {
  clearAuthStorage()
}

export const isAuthenticated = () => {
  const token = getToken()
  return !!token
}

export const getUserId = () => {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("userId") || localStorage.getItem("userId")
}

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify-email?token=${token}`);
  const { user } = response.data;
  if (user?.fullName) {
    setAuthStorage("userFullName", user.fullName);
  }
  return response.data;
};

export const resendVerificationEmail = async (email: string) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
};

export default api
