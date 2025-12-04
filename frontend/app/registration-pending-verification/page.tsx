"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, Loader2, Mail, Shield, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegistrationPendingVerificationPage() {
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState(""); // State to hold the email for resend

  // Helper functions from verify-email/page.tsx, adapted for this page's status
  const getStatusIcon = (currentStatus: 'informational' | 'resending' | 'success' | 'error') => {
    switch (currentStatus) {
      case "informational":
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center shadow-lg">
              <Mail className="w-12 h-12 text-teal-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full animate-pulse"></div>
          </div>
        );
      case "resending":
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <Clock className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      case "success": // For resend success
        return (
          <div className="relative animate-bounce">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-teal-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        );
      case "error": // For resend error
        return (
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center shadow-lg">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (currentStatus: 'informational' | 'resending' | 'success' | 'error') => {
    switch (currentStatus) {
      case "informational":
      case "resending":
      case "success":
        return "text-teal-700";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getBackgroundPattern = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-teal-50 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-teal-100 rounded-full opacity-25"></div>
      </div>
    );
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email to resend the verification link.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const apiUrl = localStorage.getItem("apiUrl") || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to resend verification email.");
      }

      toast({
        title: "Success",
        description: "Verification email resent! Please check your inbox.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while resending the email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 relative">
      {getBackgroundPattern()}

      <div className="w-full max-w-lg relative z-10">
        {/* Floating Elements */}
        <div className="absolute -top-8 left-8 w-4 h-4 bg-teal-400 rounded-full opacity-60 animate-bounce delay-300"></div>
        <div className="absolute -top-4 right-12 w-3 h-3 bg-teal-300 rounded-full opacity-40 animate-bounce delay-700"></div>

        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/95 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500"></div>

          <CardContent className="p-10">
            {/* Header with enhanced typography */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-teal-800 bg-clip-text text-transparent mb-3">
                Email Verification
              </h1>
            </div>

            {/* Status Message with better styling */}
            <div className="text-center mb-10">
              <div className="bg-gradient-to-r from-gray-50 to-teal-50/50 rounded-2xl p-6 border border-gray-100">
                <p
                  className={`text-lg leading-relaxed font-medium ${getStatusColor(isResending ? 'resending' : 'informational')}`}
                >
                  Thank you for registering! Please check your email for a verification message from deals@amp-ven.com. Clicking on the link in the email will conclude the verification and bring you back to CIM Amplify to complete your profile.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-teal-600 font-semibold text-sm">
                    Don't forget to check your spam folder
                  </span>
                </div>
              </div>
            </div>

            {/* Resend Email Section */}
            <div className="space-y-4">
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                  <p className="text-teal-700 font-medium mb-4">
                    If you haven't received the email, you can request a new one below.
                  </p>
                  <div className="mb-4">
          <input
            type="email"
            placeholder="Enter your email to resend"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    variant="outline"
                    className="w-full text-teal-600 border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300 rounded-xl font-semibold py-3 px-6 transition-all duration-300"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <footer className="text-center mt-10">
          <div className="inline-flex items-center justify-center space-x-3 text-sm text-gray-400 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm border border-gray-100">
            <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-medium">© 2025 CIM Amplify</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>All rights reserved</span>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}