"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export function BuyerProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const { forceLogout, isLoading: authLoading } = useAuth()

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

        // Wrong role - redirect to appropriate login
        if (userRole && userRole !== "buyer") {
          if (userRole === "seller") {
            router.push("/seller/login")
          } else if (userRole === "admin") {
            router.push("/admin/login")
          } else {
            router.push("/buyer/login")
          }
          return
        }

        // Authenticated as buyer
        setIsAuthenticated(true)
      } catch {
        router.push("/buyer/login")
      }
    }

    checkAuthentication()
  }, [router, authLoading, forceLogout])

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
