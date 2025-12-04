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
import { sellerRegister } from "@/services/api";
import Header from "@/components/ui/auth-header";
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
}

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

    // If token is provided, redirect to dashboard
    if (urlToken) {
      console.log(
        "Register page - Redirecting to dashboard with token from URL"
      );
      localStorage.setItem("userRole", "seller");
      router.push("/seller/dashboard");
      return;
    }

    // Check if already logged in
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      console.log(
        "Register page - Token found in localStorage, redirecting to dashboard"
      );
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
      console.log("Register page - Submitting registration");

      // Use the API service
      await sellerRegister({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        title: formData.title,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
      });

      toast({
        title: "Registration Successful",
        description:
          "Please check your email to verify your account before logging in.",
      });

      // Redirect to dashboard page
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
    console.log("Register page - Redirecting to Google OAuth")
    window.location.href = "http://localhost:5001/sellers/google/callback"
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

            {/* Contact information */}
            <div className="text-center mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Advisor Registration
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                To register as an advisor on our platform, please reach out to our team directly. 
                We'll guide you through the registration process and help set up your advisor account.
              </p>
              <p className="text-gray-700 mb-4">
                Please contact MacInnes at{" "}
                <a 
                  href="mailto:muhammadfarrukhjaved381@gmail.com" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  muhammadfarrukhjaved381@gmail.com
                </a>
                {" "}to begin your advisor registration process.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Include your company information, credentials, and areas of expertise in your email 
                to expedite the registration process.
              </p>
              <Button 
                type="button"
                className="w-full"
                style={{ backgroundColor: '#3aafa9' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d8a85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3aafa9';
                }}
                onClick={()=>{router.push("/seller/register")}}
              >
                Seller Registration
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
      <Footer />
    </div>
  );
}