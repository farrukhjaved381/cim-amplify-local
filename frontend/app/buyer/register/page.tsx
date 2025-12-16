"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { register } from "@/services/api";
import Header from "@/components/ui/auth-header";
import Footer from "@/components/ui/auth-footer";

interface RegisterFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  website: string;
  targetCriteria: {
    countries: string[];
  };
}

export default function BuyerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    website: "",
    targetCriteria: {
      countries: [],
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<
    Partial<RegisterFormData & { general: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");

  // Check for token and userId in URL parameters
  useEffect(() => {
    const urlToken = searchParams?.get("token");
    const urlUserId = searchParams?.get("userId");

    if (urlToken) {
      const cleanToken = urlToken.trim();
      localStorage.setItem("token", cleanToken);
      console.log(
        "Register page - Token set from URL:",
        cleanToken.substring(0, 10) + "..."
      );
    }

    if (urlUserId) {
      const cleanUserId = urlUserId.trim();
      localStorage.setItem("userId", cleanUserId);
      console.log("Register page - User ID set from URL:", cleanUserId);
    }

    // If both token and userId are provided, redirect to deals
    if (urlToken && urlUserId) {
      console.log(
        "Register page - Redirecting to acquireprofile with token and userId from URL"
      );
      localStorage.setItem("userRole", "buyer");
      router.push("/buyer/acquireprofile");
      return;
    }

    // Check if already logged in
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      console.log(
        "Register page - Token found in localStorage, redirecting to acquireprofile"
      );
      router.push("/buyer/acquireprofile");
    }
  }, [searchParams, router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Partial<RegisterFormData & { general: string }> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.website.trim()) {
      newErrors.website = "Company website is required";
    } else if (!/^[\da-z\.-]+\.[a-z\.]{2,6}([\/\w \.-]*)*\/?$/.test(formData.website)) {
      newErrors.website = "Please enter a valid website (e.g., example.com)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle traditional registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
      });

      toast({
        title: "Registration Successful",
        description:
          "Please check your email to verify your account before logging in.",
      });

      router.push("/registration-pending-verification");
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors({
        general:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      });
      toast({
        title: "Registration Failed",
        description:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    // Get API URL from localStorage or use default

    const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001"
    console.log("Register page - Redirecting to Google OAuth:", `${apiUrl}/buyers/google`)

    // Redirect to Google OAuth endpoint
    window.location.href = `${apiUrl}/buyers/google`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex bg-gradient-to-b from-[#C7D7D7] to-[#8C9EA8]">
        {/* Left side with illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
          <Image
            src="/Bg.svg"
            alt="Financial illustration with handshake and growth chart"
            width={500}
            height={500}
            priority
            className="z-10 bg-cover bg-center w-full h-full object-cover"
          />
        </div>

        {/* Right side - Registration form */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-md space-y-4 my-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-center">
              Buyer Registration
            </h1>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            {/* Google signup button */}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`${errors.email ? "border-red-300" : ""} h-12`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`${errors.fullName ? "border-red-300" : ""} h-12`}
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  className={`${errors.companyName ? "border-red-300" : ""} h-12`}
                  required
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company Website <span className="text-red-500">*</span>
                </label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="Enter your company website"
                  className={`${errors.website ? "border-red-300" : ""} h-12`}
                  required
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.website}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone{" "}
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 403 555-1212"
                  className={`${errors.phone ? "border-red-300" : ""} h-12`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`${errors.password ? "border-red-300 pr-10" : "pr-10"} h-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`${errors.confirmPassword ? "border-red-300 pr-10" : "pr-10"} h-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white h-12 rounded-lg mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  "Create an account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/buyer/login"
                className="text-[#3aafa9] hover:underline font-medium"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}