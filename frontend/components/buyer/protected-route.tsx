"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// Map buyer routes to their required permission keys
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/buyer/deals": "dashboard",
  "/buyer/marketplace": "marketplace",
  "/buyer/company-profile": "company-profile",
  "/buyer/acquireprofile": "company-profile",
  "/buyer/profile": "dashboard",
}

export function BuyerProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { forceLogout, isLoading: authLoading } = useAuth()

  // Reset auth state on pathname change to prevent flash of unauthorized content
  useEffect(() => {
    setIsAuthenticated(null)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (authLoading) return

    const checkAuthentication = () => {
      try {
        // Check sessionStorage ONLY
        const token = sessionStorage.getItem("token")
        const userRole = sessionStorage.getItem("userRole")

        // No token - redirect to login
        if (!token) {
          router.push("/buyer/login")
          return
        }

        // Token expired - clear and redirect
        if (isTokenExpired(token)) {
          sessionStorage.removeItem("token")
          sessionStorage.removeItem("refreshToken")
          sessionStorage.removeItem("userId")
          sessionStorage.removeItem("userRole")
          router.push("/buyer/login")
          return
        }

        // Wrong role - redirect to appropriate login (allow buyer-member too)
        if (userRole && userRole !== "buyer" && userRole !== "buyer-member") {
          if (userRole === "seller") {
            router.push("/seller/login")
          } else if (userRole === "admin") {
            router.push("/admin/login")
          } else {
            router.push("/buyer/login")
          }
          return
        }

        // Force password change for team members with temporary password
        const storedIsTeamMember = sessionStorage.getItem("isTeamMember") === "true"
        const storedIsTemporary = sessionStorage.getItem("isTemporaryPassword") === "true"
        if (storedIsTeamMember && storedIsTemporary && pathname !== "/buyer/member-profile") {
          router.push("/buyer/member-profile")
          return
        }

        // Permission check for team members
        if (storedIsTeamMember && pathname) {
          const requiredPermission = ROUTE_PERMISSION_MAP[pathname]
          if (requiredPermission) {
            let memberPermissions: string[] = []
            try {
              memberPermissions = JSON.parse(sessionStorage.getItem("permissions") || "[]")
            } catch { /* empty */ }
            if (!memberPermissions.includes(requiredPermission)) {
              // Redirect to first allowed page
              const firstAllowed = Object.entries(ROUTE_PERMISSION_MAP).find(
                ([, perm]) => memberPermissions.includes(perm)
              )
              router.push(firstAllowed ? firstAllowed[0] : "/buyer/member-profile")
              return
            }
          }
        }

        // Authenticated as buyer
        setIsAuthenticated(true)
      } catch {
        router.push("/buyer/login")
      }
    }

    checkAuthentication()
  }, [router, authLoading, forceLogout, pathname])

  // Show loading state
  if (isAuthenticated === null || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3aafa9]" />
        <span className="ml-2 text-lg text-gray-500">Verifying authentication...</span>
      </div>
    )
  }

  // Render children if authenticated
  return <>{children}</>
}
