"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Inbox, AlertTriangle, HelpCircle, ArrowRight, CheckCircle2, Mail, PartyPopper, Loader2 } from "lucide-react";
import api from "@/services/api";

function EmailConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<"buyer" | "seller" | null>(null);
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  useEffect(() => {
    // Get params from URL
    const email = searchParams.get("email") || "";
    const name = searchParams.get("fullName") || searchParams.get("name") || "";
    const role = searchParams.get("role") as "buyer" | "seller" | null;
    const id = searchParams.get("userId") || "";
    const t = searchParams.get("token") || "";
    const company = searchParams.get("companyName") || "";
    const phoneNum = searchParams.get("phone") || "";
    const web = searchParams.get("website") || "";

    setUserEmail(email);
    setUserName(name);
    setUserRole(role);
    setUserId(id);
    setToken(t);
    setCompanyName(company);
    setPhone(phoneNum);
    setWebsite(web);

    // Store credentials for later use
    if (t) localStorage.setItem("token", t);
    if (id) localStorage.setItem("userId", id);
    if (role) localStorage.setItem("userRole", role);

    // Trigger animation
    setTimeout(() => setIsLoaded(true), 100);
  }, [searchParams]);

  const handleInboxArrived = () => {
    if (userRole === "buyer") {
      const params = new URLSearchParams();
      if (token) params.set("token", token);
      if (userId) params.set("userId", userId);
      router.push(`/buyer/acquireprofile?${params.toString()}`);
    } else if (userRole === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/");
    }
  };

  const handleSpamJunk = () => {
    const params = new URLSearchParams();
    if (userEmail) params.set("email", userEmail);
    if (userRole) params.set("role", userRole);
    if (userId) params.set("userId", userId);
    if (token) params.set("token", token);
    if (userName) params.set("fullName", userName);
    router.push(`/junk-email-instructions?${params.toString()}`);
  };

  const handleNotArrived = async () => {
    setIsReportingIssue(true);

    // Send notification to support team
    try {
      await api.post("/mail/report-email-issue", {
        email: userEmail,
        fullName: userName,
        role: userRole,
        companyName: companyName,
        phone: phone,
        website: website,
      });
    } catch (error) {
      // Continue even if the notification fails - user should still see the help page
    }

    // Navigate to help page
    const params = new URLSearchParams();
    if (userEmail) params.set("email", userEmail);
    if (userRole) params.set("role", userRole);
    if (userId) params.set("userId", userId);
    if (token) params.set("token", token);
    if (userName) params.set("fullName", userName);
    router.push(`/email-not-received?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 md:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-gradient-to-br from-teal-200/40 to-emerald-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-teal-200/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] right-[15%] w-48 h-48 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-[20%] w-3 h-3 bg-teal-400 rounded-full opacity-60 animate-bounce delay-300"></div>
        <div className="absolute top-32 right-[25%] w-2 h-2 bg-emerald-400 rounded-full opacity-50 animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-[30%] w-2 h-2 bg-cyan-400 rounded-full opacity-40 animate-bounce delay-500"></div>
      </div>

      <div className={`w-full max-w-md sm:max-w-lg relative z-10 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Success Badge */}
        <div className={`flex justify-center mb-4 sm:mb-6 transition-all duration-500 delay-200 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Account Created Successfully</span>
          </div>
        </div>

        {/* Main Card */}
        <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-500/10 border border-white/50 overflow-hidden transition-all duration-500 delay-300 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>

          <div className="p-5 sm:p-8">
            {/* Header with celebration icon */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                You're All Set!
              </h1>

              {userName && (
                <p className="text-gray-600 text-sm sm:text-base">
                  Welcome, <span className="font-semibold text-teal-600">{userName}</span>!
                </p>
              )}
            </div>

            {/* Email notification message */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100/50 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    We've sent a welcome email to <span className="font-semibold text-teal-700">{userEmail || "your email"}</span>.
                    Let us know if you received it.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Stacked vertically with clear visual hierarchy */}
            <div className="space-y-3">
              {/* Primary: Arrived in Inbox */}
              <button
                onClick={handleInboxArrived}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 text-white p-4 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base">It arrived in my Inbox</div>
                      <div className="text-xs text-white/80">{userRole === "seller" ? "Continue to your Dashboard" : "Next -> fill out your investment criteria"}</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Secondary: Spam/Junk */}
              <button
                onClick={handleSpamJunk}
                className="w-full group border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-amber-800 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base">It arrived in Spam/Junk</div>
                      <div className="text-xs text-amber-600">We'll help you fix this</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Tertiary: Didn't arrive */}
              <button
                onClick={handleNotArrived}
                disabled={isReportingIssue}
                className="w-full group border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      {isReportingIssue ? (
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                      ) : (
                        <HelpCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm sm:text-base">
                        {isReportingIssue ? "Notifying support..." : "It didn't arrive"}
                      </div>
                      <div className="text-xs text-gray-500">We'll help you get connected</div>
                    </div>
                  </div>
                  {!isReportingIssue && (
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </button>
            </div>

            {/* Helper text */}
            <p className="text-center text-xs text-gray-400 mt-5">
              Emails typically arrive within a few minutes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-6">
          <p className="text-xs text-gray-400">
            © 2026 CIM Amplify. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-teal-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-500 text-sm font-medium">Setting up your account...</span>
        </div>
      </div>
    }>
      <EmailConfirmationContent />
    </Suspense>
  );
}
