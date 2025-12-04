"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { sellerLogin } from "@/services/api";
import { adminLogin } from "@/services/api";

export default function SellerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter()


// ...inside your component:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  // Debug: log credentials before sending
  console.log("Attempting admin login with:", { email, password });

  try {
    const response = await adminLogin({ email, password });

    // Debug: log response from backend
    console.log("Admin login response:", response);

    if (response && response.token) {
      toast({
        title: "Login Successful",
        description: "You have been successfully logged in as an admin.",
      });

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } else {
      throw new Error("Invalid login credentials or missing token.");
    }
  } catch (error: any) {
    // Debug: log error object
    console.error("Admin login error:", error);
    toast({
      title: "Login Failed",
      description: error.message || "Failed to log in. Please check your credentials.",
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
              {/* <div className="text-right mt-2">
                <Link
                  href="/seller/forgot-password"
                  className="text-sm text-[#3aafa9] hover:text-[#2a9d8f] underline"
                >
                  Forgot password?
                </Link>
              </div> */}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white py-6 rounded-3xl"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login my account"}
            </Button>
          </form>

         
        </div>
      </div>
      <Toaster />
    </div>
  );
}