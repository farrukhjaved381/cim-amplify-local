"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Mail, Lock } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import Header from "@/components/ui/auth-header";
import Footer from "@/components/ui/auth-footer";
import { ErrorHandler } from "@/lib/error-handler";

export default function BuyerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate email format
  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Please enter a valid email address";
    return undefined;
  };

  // Validate password
  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    return undefined;
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
    if (error) setError("");
  };

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setFieldErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
    if (error) setError("");
  };

  // Handle field blur for validation
  const handleBlur = (field: "email" | "password") => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === "email") {
      setFieldErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else {
      setFieldErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Check for token and userId in URL parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionExpired = searchParams?.get("session") === "expired";
    if (sessionExpired) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    }

    const urlToken = searchParams?.get("token");
    const urlUserId = searchParams?.get("userId");

    if (urlToken && urlUserId) {
      // Step 1: Clear old auth from sessionStorage only
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userRole");

      // Step 2: Store new values in sessionStorage only
      const cleanToken = urlToken.trim();
      const cleanUserId = urlUserId.trim();

      sessionStorage.setItem("token", cleanToken);
      sessionStorage.setItem("userId", cleanUserId);
      sessionStorage.setItem("userRole", "buyer");

      // Step 3: Redirect to deals page
      router.replace("/buyer/deals");
      return;
    }

    // Already logged in (e.g. user refreshed login page)
    const storedToken = sessionStorage.getItem("token");
    const storedRole = sessionStorage.getItem("userRole");

    if (storedToken && storedRole === "buyer") {
      router.push("/buyer/deals");
    }
  }, [searchParams, router]);

  // Update the handleSubmit function to properly handle the login response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all fields before submission
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setFieldErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      // Get API URL from localStorage or use default
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

      // Use fetch directly for more control
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          userType: "buyer", // Explicitly specify user type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = ErrorHandler.getAuthErrorMessage({ response: { status: response.status, data: errorData } });
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Extract token
      const token = data.token || data.access_token;
      if (!token) {
        throw new Error("Login response missing token");
      }

      // Extract userId
      const userId = data.userId || (data.user && data.user.id);

      // Extract refresh token if available
      const refreshToken = data.refresh_token;

      // Use auth context login function to store tokens and set up auto-refresh
      login(token, userId || "", "buyer", refreshToken);

      toast({
        title: "Login Successful",
        description: "You have been successfully logged in.",
      });

      // Redirect to deals page
      setTimeout(() => {
        router.push("/buyer/deals");
      }, 1000);
    } catch (err: any) {
      const errorMessage = ErrorHandler.getAuthErrorMessage(err);
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    try {
      // Get API URL from localStorage or use default
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";

      // Store the current page as the return URL
      localStorage.setItem("authReturnUrl", "/buyer/deals");

      // Redirect to Google OAuth endpoint
      window.location.href = `${apiUrl}/buyers/google`;
    } catch {
      toast({
        title: "Login Error",
        description: "Failed to initiate Google login. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Header />
      <div className="flex h-screen bg-gradient-to-b from-[#C7D7D7] to-[#8C9EA8] overflow-hidden">
        {/* Left side - Illustration */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
          <Image
            src="/Bg.svg"
            alt="Financial illustration with handshake and growth chart"
            width={500}
            height={500}
            priority
            className="z-10 bg-cover bg-center w-full h-full object-cover"
          />
        </div>

        {/* Right side - Login form */}
        <div className="w-full md:w-2/3 bg-white  flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Buyer Login</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Google login button */}

            {/* Divider */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors duration-200 ${fieldErrors.email && touched.email ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder=""
                    required
                    className={`pl-10 h-12 transition-all duration-200 ${fieldErrors.email && touched.email ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                  />
                </div>
                {fieldErrors.email && touched.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors duration-200 ${fieldErrors.password && touched.password ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder=""
                    required
                    className={`pl-10 pr-10 h-12 transition-all duration-200 ${fieldErrors.password && touched.password ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-teal-600 transition-colors duration-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && touched.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {fieldErrors.password}
                  </p>
                )}
                {/* Forgot Password Link */}
                <div className="text-right mt-2">
                  <Link
                    href="/buyer/forgot-password"
                    className="text-sm text-teal-600 hover:text-teal-700 hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <AnimatedButton
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white h-12 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
                isLoading={isLoading}
                loadingText="Logging in..."
              >
                Login to my account
              </AnimatedButton>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/buyer/register"
                className="text-teal-600 hover:text-teal-700 hover:underline font-medium transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
}
