"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Shield, Star, ArrowRight, Smartphone, Monitor, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function JunkEmailInstructionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userRole, setUserRole] = useState<"buyer" | "seller" | null>(null);
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const role = searchParams.get("role") as "buyer" | "seller" | null;
    const id = searchParams.get("userId") || "";
    const t = searchParams.get("token") || "";

    setUserRole(role);
    setUserId(id);
    setToken(t);
  }, [searchParams]);

  const handleContinue = () => {
    if (userRole === "buyer") {
      router.push(`/buyer/acquireprofile${token ? `?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}` : ""}`);
    } else if (userRole === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 xs:-top-40 xs:-left-40 w-48 h-48 xs:w-64 xs:h-64 sm:w-80 sm:h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 xs:-right-40 w-56 h-56 xs:w-72 xs:h-72 sm:w-96 sm:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 xs:-bottom-40 left-1/3 w-48 h-48 xs:w-64 xs:h-64 sm:w-80 sm:h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-yellow-600/20 backdrop-blur-sm"></div>
        <div className="relative max-w-4xl 2xl:max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-sm rounded-full mb-4 sm:mb-6 shadow-2xl shadow-amber-500/25">
              <div className="w-11 h-11 xs:w-12 xs:h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-orange-200 mb-2 sm:mb-4 tracking-tight px-2">
              How to Whitelist CIM Amplify
            </h1>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl 2xl:text-2xl text-white/80 max-w-2xl 2xl:max-w-3xl mx-auto leading-relaxed px-2">
              Follow these steps to ensure you receive all important emails from us in your inbox.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl 2xl:max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20">
          {/* Intro Section */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
            <h2 className="text-base xs:text-lg sm:text-xl 2xl:text-2xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 xs:w-5 xs:h-5 2xl:w-6 2xl:h-6 text-amber-400" />
              Whitelist Meaning
            </h2>
            <p className="text-white/80 leading-relaxed text-xs xs:text-sm sm:text-base 2xl:text-lg">
              Whitelisting an email address means you are adding an address to an approved senders list and telling your email provider that you want messages from that sender in your inbox. If you're wondering "why am I not receiving emails?" these procedures will help solve that issue.
            </p>
          </div>

          {/* Gmail Desktop Instructions */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 border-b border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 xs:p-4 sm:p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-bold text-white mb-3 sm:mb-4 flex items-center text-sm xs:text-base sm:text-lg 2xl:text-xl">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12 bg-red-500/20 rounded-lg mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 2xl:w-6 2xl:h-6 text-red-400" />
                </div>
                Gmail on Desktop/Laptop
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs xs:text-sm sm:text-base 2xl:text-lg text-white/80">
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Click on the settings button (the gear icon in the top-right corner) and click on "See all settings"</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Click on the tab at the top labeled "Filters and Blocked Addresses"</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Select "Create a new filter" and add <span className="font-semibold text-amber-300">@amp-ven.com</span> in the From section</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Mark "Never send to spam" and click "Create filter"</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Gmail Mobile Instructions */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 border-b border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 xs:p-4 sm:p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-bold text-white mb-3 sm:mb-4 flex items-center text-sm xs:text-base sm:text-lg 2xl:text-xl">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12 bg-red-500/20 rounded-lg mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 2xl:w-6 2xl:h-6 text-red-400" />
                </div>
                Gmail Mobile App
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs xs:text-sm sm:text-base 2xl:text-lg text-white/80">
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Open Gmail on your phone</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Navigate to the spam or junk folder and tap on the CIM Amplify email</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Select "Move to Inbox" or tap the three dots and choose "Not spam"</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Outlook Desktop Instructions */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 border-b border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 xs:p-4 sm:p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-bold text-white mb-3 sm:mb-4 flex items-center text-sm xs:text-base sm:text-lg 2xl:text-xl">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12 bg-blue-500/20 rounded-lg mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 2xl:w-6 2xl:h-6 text-blue-400" />
                </div>
                Outlook on Desktop/Laptop
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs xs:text-sm sm:text-base 2xl:text-lg text-white/80">
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Click on "Settings" and then "View all Outlook Settings"</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Go to "Junk email" and choose "Safe Senders and Domains"</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Enter <span className="font-semibold text-amber-300">@amp-ven.com</span> and save</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Outlook Mobile Instructions */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 border-b border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 xs:p-4 sm:p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <h3 className="font-bold text-white mb-3 sm:mb-4 flex items-center text-sm xs:text-base sm:text-lg 2xl:text-xl">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12 bg-blue-500/20 rounded-lg mr-2 sm:mr-3 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 2xl:w-6 2xl:h-6 text-blue-400" />
                </div>
                Outlook Mobile App
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs xs:text-sm sm:text-base 2xl:text-lg text-white/80">
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Open the Outlook app and find the CIM Amplify email</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Tap the three dots in the corner</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Select "Move to focused inbox"</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-amber-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>When prompted, click "Move this and all future messages"</span>
                </li>
              </ul>
            </div>
          </div>

          {/* IT Department Note */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-4 xs:py-5 sm:py-6 border-b border-white/10">
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-3 xs:p-4 sm:p-5 border border-purple-400/20">
              <p className="text-white/80 text-center text-xs xs:text-sm sm:text-base 2xl:text-lg">
                <span className="font-semibold text-purple-300">Still not receiving emails?</span> Contact your IT Department and ask them to whitelist <span className="font-semibold text-amber-300">@amp-ven.com</span>
              </p>
            </div>
          </div>

          {/* Continue Button */}
          <div className="px-4 xs:px-5 sm:px-6 md:px-8 py-5 xs:py-6 sm:py-8">
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold py-4 xs:py-5 sm:py-6 px-4 xs:px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-emerald-400/30 transform hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm xs:text-base sm:text-lg 2xl:text-xl">
                  {userRole === "buyer" ? "Next -> fill out your investment criteria" : "I've Whitelisted - Continue to Dashboard"}
                </span>
                {userRole !== "buyer" && (
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </Button>
          </div>

          {/* Footer */}
          <div className="bg-white/5 backdrop-blur-sm px-4 xs:px-5 sm:px-6 md:px-8 py-3 sm:py-4 border-t border-white/10">
            <p className="text-center text-xs sm:text-sm 2xl:text-base text-white/60">
              © 2026 CIM Amplify. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JunkEmailInstructionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white/60 text-xs sm:text-sm">Loading...</span>
        </div>
      </div>
    }>
      <JunkEmailInstructionsContent />
    </Suspense>
  );
}
