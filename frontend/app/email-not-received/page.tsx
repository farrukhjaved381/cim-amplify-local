"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Phone, MessageCircle, ArrowRight, HeadphonesIcon, UserCheck, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function EmailNotReceivedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<"buyer" | "seller" | null>(null);
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const email = searchParams.get("email") || "";
    const name = searchParams.get("fullName") || "";
    const role = searchParams.get("role") as "buyer" | "seller" | null;
    const id = searchParams.get("userId") || "";
    const t = searchParams.get("token") || "";

    setUserEmail(email);
    setUserName(name);
    setUserRole(role);
    setUserId(id);
    setToken(t);
  }, [searchParams]);

  const handleContinueToCriteria = () => {
    if (userRole === "buyer") {
      router.push(`/buyer/acquireprofile${token ? `?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}` : ""}`);
    } else if (userRole === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-50 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-indigo-100 rounded-full opacity-25"></div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Floating Elements */}
        <div className="absolute -top-8 left-8 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-bounce delay-300"></div>
        <div className="absolute -top-4 right-12 w-3 h-3 bg-indigo-300 rounded-full opacity-40 animate-bounce delay-700"></div>

        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/95 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <CardContent className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <HeadphonesIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent mb-3">
                We're Here to Help
              </h1>
              {userName && (
                <p className="text-gray-600 text-lg">
                  Don't worry, <span className="font-semibold text-blue-600">{userName}</span>!
                </p>
              )}
            </div>

            {/* Message */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Someone from CIM Amplify will contact you</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our team has been notified about your email delivery issue. A member of our support team will reach out to you at <span className="font-semibold text-blue-700">{userEmail || "your email address"}</span> to help resolve this.
                  </p>
                </div>
              </div>
            </div>

            {/* In the meantime message */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-2">In the meantime...</h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can continue to fill out your {userRole === "buyer" ? "investment criteria" : "profile"}. This will help us match you with the best opportunities while we resolve the email issue.
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinueToCriteria}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group mb-6"
            >
              <div className="flex items-center justify-center gap-3">
                <ClipboardList className="w-5 h-5" />
                <span className="font-semibold text-base">
                  {userRole === "buyer" ? "Next -> fill out your investment criteria" : "Continue to Dashboard"}
                </span>
                {userRole !== "buyer" && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </Button>

            {/* Contact Info */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Need immediate assistance? Contact us directly:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:support@amp-ven.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">support@amp-ven.com</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-xs sm:text-sm text-gray-400">
            © 2026 CIM Amplify. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function EmailNotReceivedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-sm">Loading...</span>
        </div>
      </div>
    }>
      <EmailNotReceivedContent />
    </Suspense>
  );
}
