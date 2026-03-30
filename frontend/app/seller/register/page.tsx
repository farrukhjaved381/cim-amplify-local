"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeIcon, EyeOffIcon, Mail, User, Building2, Globe, Phone, Lock, CheckCircle2, Briefcase } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { sellerRegister } from "@/services/api";
import Header from "@/components/ui/auth-header";
import { ga4Events } from "@/lib/ga4";
import Footer from "@/components/ui/auth-footer";

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  title: string;
  phoneNumber: string;
  website: string;
  referralSource: string;
}

const REFERRAL_SOURCES = [
  "AI Search",
  "Email from CIM Amplify",
  "LinkedIn",
  "Reddit",
  "Referral",
  "Search result",
  "Other",
];

export default function SellerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    title: "",
    phoneNumber: "",
    website: "",
    referralSource: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<
    Partial<RegisterFormData & { general: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for token and userId in URL parameters
  useEffect(() => {
    const urlToken = searchParams?.get("token");
    const urlUserId =
      searchParams?.get("userId") ||
      searchParams?.get("userid") ||
      searchParams?.get("id");

    if (urlToken) {
      const cleanToken = urlToken.trim();
      localStorage.setItem("token", cleanToken);
      localStorage.setItem("userRole", "seller");
    }

    if (urlUserId) {
      const cleanUserId = urlUserId.trim();
      localStorage.setItem("userId", cleanUserId);
    }

    // If token is provided, redirect to dashboard
    if (urlToken) {
      localStorage.setItem("userRole", "seller");
      router.push("/seller/dashboard");
      return;
    }

    // Check if already logged in
    const storedToken = sessionStorage.getItem("token");
    if (storedToken) {
      router.push("/seller/dashboard");
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

    if (!formData.referralSource) {
      newErrors.referralSource = "Please tell us how you heard about us";
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


      // Use the API service
      const response = await sellerRegister({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        title: formData.title,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        referralSource: formData.referralSource,
      });

      // Store token and user info if returned from registration
      if (response?.token) {
        localStorage.setItem("token", response.token);
      }
      if (response?.userId || response?._id) {
        localStorage.setItem("userId", response.userId || response._id);
      }
      localStorage.setItem("userRole", "seller");

      ga4Events.formEndSeller();

      toast({
        title: "Welcome to CIM Amplify!",
        description:
          "Your account has been created. We've sent you a welcome email.",
      });

      // Redirect to email confirmation page with user details
      const params = new URLSearchParams({
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        role: "seller",
      });
      if (response?.userId) params.set("userId", response.userId);
      if (response?._id) params.set("userId", response._id);
      if (response?.token) params.set("token", response.token);
      if (formData.companyName.trim()) params.set("companyName", formData.companyName.trim());
      if (formData.phoneNumber.trim()) params.set("phone", formData.phoneNumber.trim());
      if (formData.website.trim()) params.set("website", formData.website.trim());

      router.push(`/email-confirmation?${params.toString()}`);
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message.includes("Email already exists")) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (error.message && error.message.includes("Network Error")) {
        errorMessage = "Network connection error. Please check your internet connection and try again.";
      } else if (error.response?.status === 409) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a few minutes.";
      }
      
      setErrors({ general: errorMessage });
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = () => {
    window.location.href = "https://cim-backend.vercel.app/sellers/google/callback"
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#C3C6BE] to-[#828673]">
      <Header />
      <main className="flex-grow flex overflow-hidden">
        {/* Left side with illustration */}
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

        {/* Right side - Registration form */}
        <div className="w-full md:w-2/3 bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-3">
            <h1 className="text-3xl font-bold mb-8 text-center">
            Advisor Registration
            </h1>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            {/* Google signup button */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors duration-200 ${errors.email ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                  {formData.email && !errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Company Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className={`h-5 w-5 transition-colors duration-200 ${errors.companyName ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.companyName ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                </div>
                {errors.companyName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.companyName}
                  </p>
                )}
              </div>

              {/* Full Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 transition-colors duration-200 ${errors.fullName ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your First and Last Names"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.fullName ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Title Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className={`h-5 w-5 transition-colors duration-200 ${errors.title ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your title"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                </div>
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className={`h-5 w-5 transition-colors duration-200 ${errors.phoneNumber ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1 403 555-1212"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.phoneNumber ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Website Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700"
                >
                  Website <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className={`h-5 w-5 transition-colors duration-200 ${errors.website ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="website"
                    name="website"
                    type="text"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="Enter your company website"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.website ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                </div>
                {errors.website && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.website}
                  </p>
                )}
              </div>

              {/* Referral Source Dropdown */}
              <div className="space-y-1.5">
                <label
                  htmlFor="referralSource"
                  className="block text-sm font-medium text-gray-700"
                >
                  How did you hear about CIM Amplify? <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.referralSource}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, referralSource: value }));
                    if (errors.referralSource) {
                      setErrors((prev) => ({ ...prev, referralSource: undefined }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={`w-full h-12 rounded-lg transition-all duration-200 ${
                      errors.referralSource
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"
                    } focus:ring-2 ${
                      !formData.referralSource ? "text-gray-500" : "text-gray-900"
                    }`}
                  >
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                    {REFERRAL_SOURCES.map((source) => (
                      <SelectItem
                        key={source}
                        value={source}
                        className="cursor-pointer hover:bg-teal-50 focus:bg-teal-50 focus:text-teal-900 py-2.5 px-3"
                      >
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.referralSource && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.referralSource}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors duration-200 ${errors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 h-12 transition-all duration-200 ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
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
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors duration-200 ${errors.confirmPassword ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`pl-10 pr-10 h-12 transition-all duration-200 ${errors.confirmPassword ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-teal-600 transition-colors duration-200"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <AnimatedButton
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white h-12 rounded-lg mt-6 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                isLoading={isSubmitting}
                loadingText="Creating Account..."
              >
                Create Account
              </AnimatedButton>
            </form>

            <div className="text-center mt-4">
              <Link
                href="/seller/login"
                className="text-sm text-gray-600 hover:underline"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
      <Footer />
    </div>
  );
}
