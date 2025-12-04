"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Mail, Loader2, ArrowRight, Shield, Clock } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "informational">("loading")
  const [message, setMessage] = useState("Verifying your email, please wait...")
  const [role, setRole] = useState<string | null>(null)

  const token = searchParams.get("token")
  const from = searchParams.get("from")

  useEffect(() => {
    const roleFromUrl = searchParams.get("role")
    if (roleFromUrl) {
      setRole(roleFromUrl)
    }

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    async function verify() {
      try {
        const data = await verifyEmail(token);
        setRole(data.role);
        setStatus("success");
        setMessage(
          "Thank you! Your email has been successfully verified. You will be redirected shortly."
        );

        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userRole", data.role);

        // Redirect to the appropriate page after a short delay
        setTimeout(() => {
          if (data.role === "buyer") {
            router.push("/buyer/acquireprofile");
          } else if (data.role === "seller") {
            router.push("/seller/company-profile");
          } else {
            router.push("/login"); // Fallback
          }
        }, 2000); // 2-second delay
      } catch (error) {
        setStatus("error");
        setMessage(
          "Verification failed or token expired. Please request a new verification email."
        );
      }
    }

    verify();
  }, [token, from, searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <Clock className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      case "success":
        return (
          <div className="relative animate-bounce">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-teal-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        );
      case "error":
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center shadow-lg">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        );
      case "informational":
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center shadow-lg">
              <Mail className="w-12 h-12 text-teal-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full animate-pulse"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-teal-700";
      case "success":
        return "text-teal-800";
      case "error":
        return "text-red-600";
      case "informational":
        return "text-teal-700";
      default:
        return "text-gray-600";
    }
  };

  const getBackgroundPattern = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-teal-50 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-teal-100 rounded-full opacity-25"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 relative">
      {getBackgroundPattern()}

      <div className="w-full max-w-lg relative z-10">
        {/* Floating Elements */}
        <div className="absolute -top-8 left-8 w-4 h-4 bg-teal-400 rounded-full opacity-60 animate-bounce delay-300"></div>
        <div className="absolute -top-4 right-12 w-3 h-3 bg-teal-300 rounded-full opacity-40 animate-bounce delay-700"></div>

        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/95 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500"></div>

          <CardContent className="p-10">
            {/* Header with enhanced typography */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-teal-800 bg-clip-text text-transparent mb-3">
                Email Verification
              </h1>
            </div>

            {/* Status Message with better styling */}
            <div className="text-center mb-10">
              <div className="bg-gradient-to-r from-gray-50 to-teal-50/50 rounded-2xl p-6 border border-gray-100">
                <p
                  className={`text-lg leading-relaxed font-medium ${getStatusColor()}`}
                >
                  {message}
                </p>
                {status === "success" && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-teal-600 font-semibold text-sm">
                      Welcome to CIM Amplify!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            {status !== "loading" && (
              <div className="space-y-4">
                {status === "error" && (
                  <Button
                    onClick={() => router.push("/resend-verification")}
                    variant="outline"
                    className="w-full py-4 text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300 rounded-xl font-semibold group"
                  >
                    <Mail className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                    Resend Verification Email
                  </Button>
                )}

                {/* Login button only appears when email is successfully verified */}
                {status === "success" && (
                  <div className="text-center text-gray-500">
                    Redirecting...
                  </div>
                )}

                {status === "informational" && (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                      <p className="text-teal-700 font-medium mb-4">
                        Thank you for registering! Check your inbox and click the verification link to activate your account.
                      </p>
                      <div className="text-xs text-teal-600 bg-teal-100 rounded-lg px-3 py-2 inline-block">
                        💡 Don't forget to check your spam folder
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/resend-verification")}
                      variant="outline"
                      className="text-teal-600 border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300 rounded-xl font-semibold py-3 px-6 transition-all duration-300"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Email
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Loading State */}
            {status === "loading" && (
              <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 text-teal-700 font-medium shadow-sm">
                  <div className="flex space-x-1 mr-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                  Processing verification...
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <footer className="text-center mt-10">
          <div className="inline-flex items-center justify-center space-x-3 text-sm text-gray-400 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm border border-gray-100">
            <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-medium">© 2025 CIM Amplify</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>All rights reserved</span>
          </div>
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
              <p className="text-teal-700 font-medium">Loading verification page...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}