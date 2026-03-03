"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2, Mail, Shield, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { jwtDecode } from "jwt-decode"

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success">("loading")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  const token = searchParams.get("token")
  const refreshToken = searchParams.get("refreshToken")
  const role = searchParams.get("role")
  const userId = searchParams.get("userId")
  const fullName = searchParams.get("fullName")

  useEffect(() => {
    // Set user info from URL params or decode token
    if (fullName) {
      setUserName(fullName)
    }

    if (role) {
      setUserRole(role)
    }

    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token)
        if (!userName && decoded.name) {
          setUserName(decoded.name)
        }
        if (!userRole && decoded.role) {
          setUserRole(decoded.role)
        }

        // Store credentials
        localStorage.setItem("token", token)
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken)
        }
        if (userId || decoded.sub) {
          localStorage.setItem("userId", userId || decoded.sub)
        }
        if (role || decoded.role) {
          localStorage.setItem("userRole", role || decoded.role)
        }
      } catch (error) {
        // Failed to decode token
      }
    }

    // Show success briefly then redirect
    setTimeout(() => {
      setStatus("success")
    }, 500)

    // Redirect after showing success message
    setTimeout(() => {
      const finalRole = role || userRole
      if (finalRole === "buyer") {
        const params = new URLSearchParams()
        if (token) params.set("token", token)
        if (userId) params.set("userId", userId)
        router.push(`/buyer/acquireprofile?${params.toString()}`)
      } else if (finalRole === "seller") {
        router.push("/seller/dashboard")
      } else {
        router.push("/")
      }
    }, 2000)
  }, [token, role, userId, fullName, router])

  const handleContinue = () => {
    const finalRole = role || userRole
    if (finalRole === "buyer") {
      const params = new URLSearchParams()
      if (token) params.set("token", token)
      if (userId) params.set("userId", userId)
      router.push(`/buyer/acquireprofile?${params.toString()}`)
    } else if (finalRole === "seller") {
      router.push("/seller/dashboard")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-teal-50 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-teal-100 rounded-full opacity-25"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Floating Elements */}
        <div className="absolute -top-8 left-8 w-4 h-4 bg-teal-400 rounded-full opacity-60 animate-bounce delay-300"></div>
        <div className="absolute -top-4 right-12 w-3 h-3 bg-teal-300 rounded-full opacity-40 animate-bounce delay-700"></div>

        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/95 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500"></div>

          <CardContent className="p-10">
            {/* Header */}
            <div className="text-center mb-8">
              {status === "loading" ? (
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl mb-6">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                </div>
              ) : (
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-2xl mb-6 shadow-lg animate-bounce">
                  <CheckCircle className="w-12 h-12 text-teal-600" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-teal-800 bg-clip-text text-transparent mb-3">
                {status === "loading" ? "Setting Up Your Account" : "Welcome to CIM Amplify!"}
              </h1>

              {userName && status === "success" && (
                <p className="text-gray-600 text-lg">
                  Hello, <span className="font-semibold text-teal-600">{userName}</span>!
                </p>
              )}
            </div>

            {/* Status Message */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-gray-50 to-teal-50/50 rounded-2xl p-6 border border-gray-100">
                {status === "loading" ? (
                  <p className="text-lg leading-relaxed font-medium text-teal-700">
                    Please wait while we set up your account...
                  </p>
                ) : (
                  <>
                    <p className="text-lg leading-relaxed font-medium text-teal-800">
                      Your account is ready! You're being redirected to complete your profile.
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span className="text-teal-600 font-semibold text-sm">
                        Redirecting...
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Continue Button (visible when loaded) */}
            {status === "success" && (
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="font-semibold text-lg">Continue to {userRole === "buyer" ? "Profile" : "Dashboard"}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-10">
          <p className="text-xs sm:text-sm text-gray-400">
            © 2026 CIM Amplify. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
          <Card className="w-full max-w-lg shadow-2xl border-0 backdrop-blur-xl bg-white/95">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <p className="text-teal-700 font-medium">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
