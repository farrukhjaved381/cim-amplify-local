"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import api, { resendVerificationEmail } from "@/services/api";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error("Email is required");
      }

      await resendVerificationEmail(email);

      setSuccess(true);
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your email address.",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend verification email.");
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#C7D7D7] to-[#8C9EA8] overflow-hidden">
      <div className="w-full md:w-2/3 bg-white rounded-l-[30px] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Resend Verification Email</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="mb-4 p-3 bg-green-50 border-green-200 text-green-700 rounded-md text-sm">
              A new verification email has been sent to your email address.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full py-6"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3aafa9] hover:bg-[#2a9d8f] text-white py-6 rounded-3xl"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Verification Email"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/member-login" className="text-[#3aafa9] hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}