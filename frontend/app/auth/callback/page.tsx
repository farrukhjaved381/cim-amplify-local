"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

// Helper to set auth in both storages
const setAuthStorage = (key: string, value: string) => {
  sessionStorage.setItem(key, value)
  localStorage.setItem(key, value)
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL params
        const code = searchParams?.get("code")
        const error = searchParams?.get("error")
        const token = searchParams?.get("token")
        const userId = searchParams?.get("userId")

        // If token and userId are directly provided in URL
        if (token && userId) {
          const cleanToken = token.trim()
          const cleanUserId = userId.trim()

          setAuthStorage("token", cleanToken)
          setAuthStorage("userId", cleanUserId)
          setAuthStorage("userRole", "buyer")

          setStatus("success")

          // Redirect to acquireprofile
          setTimeout(() => {
            router.push(`/buyer/acquireprofile?token=${cleanToken}&userId=${cleanUserId}`)
          }, 1500)
          return
        }

        if (error) {
          throw new Error(`Authentication error: ${error}`)
        }

        if (!code) {
          throw new Error("No authorization code received")
        }

        // Get API URL from localStorage or use default
        const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001"

        

        // Exchange the code for tokens
        const response = await fetch(`${apiUrl}/buyers/google/callback?code=${code}`, {
          method: "GET",
          headers: {
            Accept: "*/*",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Authentication failed with status: ${response.status}`)
        }

        const data = await response.json()

        // Store token, refresh token, and user ID
        if (data.token || data.access_token) {
          const cleanToken = (data.token || data.access_token).trim()
          setAuthStorage("token", cleanToken)
         

          // Store refresh token if provided
          if (data.refresh_token || data.refreshToken) {
            const cleanRefreshToken = (data.refresh_token || data.refreshToken).trim()
            setAuthStorage("refreshToken", cleanRefreshToken)
            
          }

          // Also set the userRole if it's in the response
          if (data.role) {
            setAuthStorage("userRole", data.role)
           
          } else {
            // Default to buyer role if not specified
            setAuthStorage("userRole", "buyer")
            
          }
        }

        if (data.userId) {
          const cleanUserId = data.userId.trim()
          setAuthStorage("userId", cleanUserId)
          
        }

        setStatus("success")

        // Redirect to acquireprofile
        setTimeout(() => {
          router.push("/buyer/acquireprofile")
        }, 1500)
      } catch (error: any) {
        setStatus("error")
        setErrorMessage(error.message || "Authentication failed. Please try again.")

        // Add more detailed logging for debugging
        if (error.response) {
        }

        // Redirect to login after error with a more informative query parameter
        setTimeout(() => {
          router.push(`/buyer/login?error=${encodeURIComponent(error.message || "Authentication failed")}`)
        }, 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-t-[#3aafa9] border-r-[#3aafa9] border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-[#344054]">Completing authentication...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Successful</h3>
              <p className="mt-1 text-sm text-gray-500">You will be redirected shortly...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Failed</h3>
              <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting to login page...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
