"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import Header from "@/components/ui/auth-header";
import Footer from "@/components/ui/auth-footer";

export default function BuyerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
      console.log("Login page - Token and UserID found in URL, cleaning up...");

      // Step 1: Clear old auth
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");

      // Step 2: Store new values
      const cleanToken = urlToken.trim();
      const cleanUserId = urlUserId.trim();

      localStorage.setItem("token", cleanToken);
      localStorage.setItem("userId", cleanUserId);
      localStorage.setItem("userRole", "buyer");

      console.log(
        "Login page - Auth from URL stored:",
        cleanToken.substring(0, 10) + "...",
        cleanUserId
      );

      // Step 3: Redirect (clean URL using replace)
      router.replace("/buyer/acquireprofile");
      return;
    }

    // Already logged in (e.g. user refreshed login page)
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("userRole");

    if (storedToken && storedRole === "buyer") {
      console.log("Login page - Already logged in as buyer, redirecting...");
      router.push("/buyer/acquireprofile");
    } else {
      console.log("Login page - No auth or wrong role, stay on login page.");
    }
  }, [searchParams, router]);

  // Update the handleSubmit function to properly handle the login response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!email.trim()) {
        throw new Error("Email is required");
      }
      if (!password) {
        throw new Error("Password is required");
      }

      console.log("Login page - Attempting login with:", email);

      // Get API URL from localStorage or use default
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app";

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
        throw new Error(
          errorData.message || `Login failed with status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Login response:", data);

      // Store token - adapt this to match your API response format
      if (data.token) {
        localStorage.setItem("token", data.token);
        console.log(
          "Login page - Login successful, token stored:",
          data.token.substring(0, 10) + "..."
        );
      } else if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        console.log(
          "Login page - Login successful, token stored:",
          data.access_token.substring(0, 10) + "..."
        );
      } else {
        throw new Error("Login response missing token");
      }

      // Store userId - adapt this to match your API response format
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
        console.log(
          "Login page - Login successful, userId stored:",
          data.userId
        );
      } else if (data.user && data.user.id) {
        localStorage.setItem("userId", data.user.id);
        console.log(
          "Login page - Login successful, userId stored:",
          data.user.id
        );
      } else {
        console.warn("Login page - Login response missing userId");
      }

      // Set user role
      localStorage.setItem("userRole", "buyer");

      toast({
        title: "Login Successful",
        description: "You have been successfully logged in.",
      });

      // Redirect to deals page
      setTimeout(() => {
        router.push("/buyer/deals");
      }, 1000);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
      toast({
        title: "Login Failed",
        description:
          err.message || "Login failed. Please check your credentials.",
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
      const apiUrl = localStorage.getItem("apiUrl") || "https://cim-backend.vercel.app";
      console.log(
        "Login page - Redirecting to Google OAuth:",
        `${apiUrl}/buyers/google`
      );

      // Store the current page as the return URL
      localStorage.setItem("authReturnUrl", "/buyer/deals");

      // Redirect to Google OAuth endpoint
      window.location.href = `${apiUrl}/buyers/google`;
    } catch (error) {
      console.error("Error initiating Google login:", error);
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
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  required
                  className="w-full py-6"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    required
                    className="w-full pr-10 py-6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 "
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {/* Forgot Password Link */}
                <div className="text-right mt-2">
                  <Link
                    href="/buyer/forgot-password"
                    className="text-sm text-[#3aafa9] hover:text-[#2a9d8f] underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white py-6 rounded-3xl"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login my account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/buyer/register"
                className="text-[#3aafa9] hover:underline font-medium"
              >
                signup
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