"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Mail, Lock } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { sellerLogin } from "@/services/api";
import Footer from "@/components/ui/auth-footer";
import Header from "@/components/ui/auth-header";
import { API_BASE_URL } from "@/lib/api-config";

export default function SellerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, logout } = useAuth();

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
    const urlUserId =
      searchParams?.get("userId") ||
      searchParams?.get("userid") ||
      searchParams?.get("id");
    const urlRole = searchParams?.get("role");

    if (urlToken) {
      // Clear old data to avoid conflicts from both storages
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userRole");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");

      const cleanToken = urlToken.trim();

      // Use the auth context to login with token
      login(cleanToken, urlUserId || "unknown", urlRole || "seller");

      // Remove query params from URL (clean redirect)
      router.replace("/seller/dashboard");
      return;
    }

    const storedToken = sessionStorage.getItem("token") || sessionStorage.getItem("token");
    const storedRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole");

    if (storedToken && isLoggedIn && storedRole === "seller") {
      router.push("/seller/dashboard");
    }
  }, [searchParams, router, login, isLoggedIn]);

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
      // Use the API service
      const data = await sellerLogin({ email, password });

      // Extract refresh token if available
      const refreshToken = data.refresh_token;

      // Check if user is a team member
      const user = data.user || {}
      const isTeamMemberLogin = user.isTeamMember === true
      const role = user.role || "seller"

      // Use the auth context to login with refresh token support
      login(
        data.token || data.access_token,
        data.userId || data.user?.id || data.id,
        role,
        refreshToken,
        isTeamMemberLogin ? {
          isTeamMember: true,
          ownerId: user.ownerId,
          ownerType: user.ownerType,
          permissions: user.permissions || [],
          isTemporaryPassword: user.isTemporaryPassword || false,
        } : undefined,
      );

      toast({
        title: "Login Successful",
        description: "You have been successfully logged in.",
      });

      // Redirect: team members with temp password go to profile, otherwise dashboard
      const redirectPath = isTeamMemberLogin && user.isTemporaryPassword
        ? "/seller/member-profile"
        : "/seller/dashboard"

      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    } catch (err: any) {
      let errorMessage = "Invalid email or password. Please check your credentials and try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && !err.message.includes("status code")) {
        errorMessage = err.message;
      }
      
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
      const apiUrl = API_BASE_URL;

      // Store the current page as the return URL
      localStorage.setItem("authReturnUrl", "/seller/dashboard");

      // Redirect to Google OAuth endpoint
      window.location.href = `${apiUrl}/sellers/google`;
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
      <div className="flex h-screen bg-gradient-to-b from-[#C3C6BE] to-[#828673] overflow-hidden">
        {/* Left side - Illustration */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center relative">
          <Image
            src="/sellerbg.svg"
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
            <h1 className="text-3xl font-bold mb-8 text-center">Advisor Login</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Google login button */}

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
                    href="/seller/forgot-password"
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
                href="/seller/register"
                className="text-teal-600 hover:text-teal-700 hover:underline font-medium transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        <Toaster />
      </div>
      <Footer />
    </div>
  );
} 
