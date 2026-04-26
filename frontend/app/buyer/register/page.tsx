"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeIcon, EyeOffIcon, Mail, User, Building2, Globe, Phone, Lock, CheckCircle2 } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { register } from "@/services/api";
import Header from "@/components/ui/auth-header";
import { ga4Events } from "@/lib/ga4";
import Footer from "@/components/ui/auth-footer";
import { API_BASE_URL } from "@/lib/api-config";

interface RegisterFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  website: string;
  referralSource: string;
  signUpForSms: boolean;
  targetCriteria: {
    countries: string[];
  };
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
    referralSource: "",
    signUpForSms: false,
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
    }

    if (urlUserId) {
      const cleanUserId = urlUserId.trim();
      localStorage.setItem("userId", cleanUserId);
    }

    // If both token and userId are provided, redirect to deals
    if (urlToken && urlUserId) {
      localStorage.setItem("userRole", "buyer");
      router.push("/buyer/acquireprofile");
      return;
    }

    // Check if already logged in
    const storedToken = sessionStorage.getItem("token");
    if (storedToken) {
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

  // Validate phone number format
  const isValidPhoneNumber = (phone: string) => {
    // Remove all non-digit characters except + for country code
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Phone should have at least 10 digits (basic validation)
    const digitsOnly = cleaned.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
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

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits)";
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
    } else if (!/^(https?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+\/?.*$/.test(formData.website.trim())) {
      newErrors.website = "Please enter a valid website (e.g., www.example.com or https://example.com)";
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
      const response = await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        companyName: formData.companyName.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        referralSource: formData.referralSource,
        signUpForSms: formData.signUpForSms,
      });

      // Store token and user info if returned from registration
      if (response?.token) {
        localStorage.setItem("token", response.token);
      }
      if (response?.userId || response?._id) {
        localStorage.setItem("userId", response.userId || response._id);
      }
      localStorage.setItem("userRole", "buyer");

      ga4Events.formEndBuyer();

      toast({
        title: "Welcome to CIM Amplify!",
        description:
          "Your account has been created. We've sent you a welcome email.",
      });

      // Redirect to email confirmation page with user details
      const params = new URLSearchParams({
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        role: "buyer",
      });
      if (response?.userId) params.set("userId", response.userId);
      if (response?._id) params.set("userId", response._id);
      if (response?.token) params.set("token", response.token);
      if (formData.companyName.trim()) params.set("companyName", formData.companyName.trim());
      if (formData.phone.trim()) params.set("phone", formData.phone.trim());
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
    const apiUrl = API_BASE_URL;

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

              {/* Website Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Website <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className={`h-5 w-5 transition-colors duration-200 ${errors.website ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="website"
                    name="website"
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

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className={`h-5 w-5 transition-colors duration-200 ${errors.phone ? "text-red-400" : "text-gray-400 group-focus-within:text-teal-500"}`} />
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 403 555-1212"
                    className={`pl-10 h-12 transition-all duration-200 ${errors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"} focus:ring-2`}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.phone}
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

              {/* Sign up for SMS */}
              <div className="space-y-1.5">
                <label htmlFor="signUpForSms" className="flex items-start gap-2 cursor-pointer">
                  <input
                    id="signUpForSms"
                    name="signUpForSms"
                    type="checkbox"
                    checked={formData.signUpForSms}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, signUpForSms: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Sign up for SMS</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      You agree to receive automated transactional messages. Message frequency may vary. Standard message and data rates may apply. Reply STOP to opt out, HELP for assistance. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes.
                    </span>
                  </span>
                </label>
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
                loadingText="Creating account..."
              >
                Next - Fill out your Investment Criteria
              </AnimatedButton>
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
