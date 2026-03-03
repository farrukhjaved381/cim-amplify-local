'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function VerifyEmailFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || '';
  const userId = searchParams.get('userId') || '';

  const handleContactSupport = () => {
    // Redirect to email-not-received page for support
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    if (role) params.set('role', role);
    if (userId) params.set('userId', userId);
    router.push(`/email-not-received?${params.toString()}`);
  };

  const handleTryAgain = () => {
    // Redirect to login based on role
    if (role === 'buyer') {
      router.push('/buyer/login');
    } else if (role === 'seller') {
      router.push('/seller/login');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full opacity-15 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/95 overflow-hidden relative">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>

          <CardContent className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-6 shadow-lg">
                <HelpCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                Having Trouble?
              </h1>
              <p className="text-gray-600">
                No worries! We're here to help you get started.
              </p>
            </div>

            {/* Message */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 mb-8">
              <p className="text-gray-700 text-center leading-relaxed">
                If you're having trouble with your email, our team can help. Click below to get assistance, or try logging in if you've already set up your account.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleContactSupport}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-center gap-3">
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold">Get Help with Email</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>

              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 py-6 rounded-xl hover:bg-gray-50 transition-all duration-300"
              >
                <span className="font-semibold">Go to Login</span>
              </Button>
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

export default function VerifyEmailFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-sm">Loading...</span>
        </div>
      </div>
    }>
      <VerifyEmailFailureContent />
    </Suspense>
  );
}
