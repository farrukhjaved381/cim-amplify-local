"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// Helper function to clear auth and get login page
const clearAuthAndGetLoginPage = (): string => {
  try {
    const userRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole")

    // Clear all auth data
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("refreshToken")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userRole")
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")

    // Return appropriate login page
    switch (userRole) {
      case "buyer":
        return "/buyer/login"
      case "seller":
        return "/seller/login"
      case "admin":
        return "/admin/login"
      default:
        return "/member-login"
    }
  } catch {
    return "/member-login"
  }
}

// Check if error is auth-related
const isAuthError = (error: Error | null): boolean => {
  if (!error) return false
  const errorMessage = error.message.toLowerCase()
  return (
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("401") ||
    errorMessage.includes("token") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("session") ||
    errorMessage.includes("expired")
  )
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI instead of crashing the app.
 *
 * For auth-related errors, provides a direct logout option.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    })

    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Log to your error tracking service here
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleLogoutAndRedirect = () => {
    const loginPage = clearAuthAndGetLoginPage()
    window.location.href = loginPage
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const showAuthError = isAuthError(this.state.error)

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-600 mb-6">
              {showAuthError
                ? "Your session may have expired. Please log out and sign in again."
                : "We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists."}
            </p>

            <div className="flex gap-3 flex-wrap justify-center">
              {showAuthError ? (
                <Button
                  onClick={this.handleLogoutAndRedirect}
                  className="flex items-center gap-2 bg-[#3AAFA9] hover:bg-[#2d8f8a]"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out & Sign In Again
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={this.handleReset}
                    className="flex items-center gap-2"
                  >
                    Try Again
                  </Button>

                  <Button
                    onClick={this.handleReload}
                    className="flex items-center gap-2 bg-[#3AAFA9] hover:bg-[#2d8f8a]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </Button>
                </>
              )}

              {/* Always show logout option */}
              {!showAuthError && (
                <Button
                  variant="outline"
                  onClick={this.handleLogoutAndRedirect}
                  className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              )}
            </div>

            {/* Show error details in development only */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 w-full text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                  <p className="text-red-600 font-semibold mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-gray-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
