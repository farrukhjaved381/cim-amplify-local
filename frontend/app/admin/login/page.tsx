"use client";

import type React from "react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/auth-context";
import { adminLogin } from "@/services/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const router = useRouter()

  const { login } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    const response = await adminLogin({ email, password });

    if (response && response.token) {
      // Use auth context to handle login with refresh token support
      login(
        response.token,
        response.userId,
        response.userRole || "admin",
        response.refresh_token
      );

      // Store additional admin-specific data in both storages
      if (response.userEmail) {
        sessionStorage.setItem("userEmail", response.userEmail);
        localStorage.setItem("userEmail", response.userEmail);
      }
      if (response.userFullName) {
        sessionStorage.setItem("userFullName", response.userFullName);
        localStorage.setItem("userFullName", response.userFullName);
      }

      toast({
        title: "Login Successful",
        description: "You have been successfully logged in as an admin.",
      });

      setTimeout(() => {
        router.push("/admin/overview");
      }, 1000);
    } else {
      throw new Error("Invalid login credentials or missing token.");
    }
  } catch (error: any) {
    let errorMessage = "Invalid email or password. Please check your credentials and try again.";
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message && !error.message.includes("status code")) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Login Failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
  return (
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
      <div className="w-full md:w-2/3 bg-white rounded-l-[30px] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Google login button */}
    
      
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
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder=""
                required
                className={`w-full py-6 ${fieldErrors.email && touched.email ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
              />
              {fieldErrors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
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
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder=""
                  required
                  className={`w-full pr-10 py-6 ${fieldErrors.password && touched.password ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
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
              {fieldErrors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <AnimatedButton
              type="submit"
              className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white py-6 rounded-3xl"
              isLoading={isLoading}
              loadingText="Logging in..."
            >
              Login my account
            </AnimatedButton>
          </form>

         
        </div>
      </div>
      <Toaster />
    </div>
  );
}