"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page now just redirects to the email help page since verification is no longer required
export default function ResendVerificationPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the email not received help page
    router.replace("/email-not-received");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 text-sm">Redirecting...</span>
      </div>
    </div>
  );
}
