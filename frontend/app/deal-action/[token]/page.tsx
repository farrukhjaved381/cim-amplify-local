'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

type ActionState = 'loading' | 'success' | 'already_done' | 'error';

export default function DealActionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  const action = searchParams?.get('action') as 'activate' | 'pass' | 'loi' | 'off-market' | 'flag-inactive' | null;
  const role = searchParams?.get('role') as 'buyer' | 'seller' | null;

  const [state, setState] = useState<ActionState>('loading');
  const [message, setMessage] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [showCloseHint, setShowCloseHint] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(action === 'flag-inactive' && role === 'seller');

  // Guards against React StrictMode double-invoke and any other re-render races,
  // which previously caused a brief "error/warning" modal flash before the real
  // success modal appeared on the buyer monthly report links.
  const requestInFlightRef = useRef(false);

  const tryCloseTab = () => {
    window.close();
    setTimeout(() => {
      setShowCloseHint(true);
    }, 250);
  };

  useEffect(() => {
    if (!token || !action) {
      setState('error');
      setMessage('Invalid link. Please check the link in your email and try again.');
      return;
    }

    if (!['activate', 'pass', 'loi', 'off-market', 'flag-inactive'].includes(action)) {
      setState('error');
      setMessage('Invalid action. The link may be malformed.');
      return;
    }

    if (action === 'flag-inactive' && role === 'seller') {
      setState('success');
      setMessage('Do you want to mark this buyer as inactive for this deal? This will only affect this one buyer on this one deal.');
      setDealTitle('');
      setAwaitingConfirm(true);
      return;
    }

    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const performAction = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/deals/email-action/${token}?action=${action}`, {
          method: 'POST',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.message?.includes('already')) {
            setState('already_done');
          } else {
            setState('success');
          }
          setMessage(data.message);
          if (data.dealTitle) setDealTitle(data.dealTitle);
        } else {
          setState('error');
          setMessage(data.message || 'Something went wrong. Please try logging in to your dashboard.');
        }
      } catch {
        setState('error');
        setMessage('Unable to connect to the server. Please try again later or log in to your dashboard.');
      }
    };

    performAction();
  }, [token, action, role]);

  // Per-second auto-close countdown so the user can see it ticking down.
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (state !== 'success' && state !== 'already_done') return;
    if (action === 'flag-inactive' && role === 'seller') return;

    setCloseCountdown(5);
    const interval = window.setInterval(() => {
      setCloseCountdown((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          window.clearInterval(interval);
          tryCloseTab();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state]);

  const isActivate = action === 'activate' || action === 'loi';
  const isSellerAction = role === 'seller';
  const isFlagFlow = action === 'flag-inactive' && role === 'seller';

  const handleConfirmFlag = async (confirmed: boolean) => {
    if (!confirmed) {
      setState('already_done');
      setMessage('No changes were made.');
      setAwaitingConfirm(false);
      return;
    }

    setState('loading');
    setMessage('Flagging the buyer as inactive...');
    setAwaitingConfirm(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/deals/email-action/${token}?action=flag-inactive`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setState('success');
        setMessage(data.message || 'Buyer flagged inactive successfully.');
        if (data.dealTitle) setDealTitle(data.dealTitle);
      } else {
        setState('error');
        setMessage(data.message || 'Something went wrong. Please try again later.');
      }
    } catch {
      setState('error');
      setMessage('Unable to connect to the server. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-3 sm:px-4 md:px-6 py-6 sm:py-8 font-poppins">
      <div className="w-full max-w-[calc(100%-1rem)] sm:max-w-md md:max-w-lg">
        {/* Logo */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <img
            src="/illustration.png"
            alt="CIM Amplify"
            className="h-16 sm:h-20 md:h-24 w-auto mx-auto"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {/* Header bar */}
          <div
            className="h-1.5 sm:h-2"
            style={{
              backgroundColor:
                state === 'loading' ? '#6b7280' :
                state === 'error' ? '#E35153' :
                isActivate ? '#3AAFA9' : '#E35153',
            }}
          />

          <div className="px-5 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 text-center">
            {/* Icon */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              {state === 'loading' && (
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-100">
                  <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-500 animate-spin" />
                </div>
              )}
              {state === 'success' && (
                <div
                  className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full"
                  style={{ backgroundColor: isActivate ? '#e6f7f6' : '#fce8e8' }}
                >
                  {isActivate ? (
                    <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#3AAFA9]" />
                  ) : (
                    <XCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#E35153]" />
                  )}
                </div>
              )}
              {state === 'already_done' && (
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-blue-50">
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-500" />
                </div>
              )}
              {state === 'error' && (
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-red-50">
                  <XCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#E35153]" />
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#2f2b43] mb-2 sm:mb-3">
              {state === 'loading' && 'Processing your request...'}
              {state === 'success' && isSellerAction && action === 'loi' && 'Deal Paused for LOI'}
              {state === 'success' && isSellerAction && action === 'off-market' && 'Deal Taken Off Market'}
              {state === 'success' && isSellerAction && action === 'flag-inactive' && 'Buyer Flagged Inactive'}
              {state === 'success' && !isSellerAction && isActivate && 'Deal Moved to Active'}
              {state === 'success' && !isSellerAction && !isActivate && 'Deal Passed'}
              {state === 'already_done' && isFlagFlow && 'Buyer Already Flagged'}
              {state === 'already_done' && !isFlagFlow && 'Action Already Taken'}
              {state === 'error' && 'Something Went Wrong'}
            </h1>

            {/* Message */}
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 px-1 sm:px-2">
              {state === 'loading'
                ? 'Please wait while we process your action...'
                : message}
            </p>

            {/* Auto-close countdown */}
            {(state === 'success' || state === 'already_done') && closeCountdown !== null && closeCountdown > 0 && !isFlagFlow && (
              <p className="text-xs text-gray-500 mb-4">
                This tab will close automatically in {closeCountdown} second{closeCountdown === 1 ? '' : 's'}...
              </p>
            )}

            {/* Action buttons */}
            {state !== 'loading' && !awaitingConfirm && !isFlagFlow && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={isSellerAction ? "/seller/dashboard" : "/buyer/deals"}
                  className="inline-block w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#3AAFA9' }}
                >
                  Go to Dashboard
                </a>
                <button
                  type="button"
                  onClick={tryCloseTab}
                  className="inline-block w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Close Tab
                </button>
              </div>
            )}
            {state !== 'loading' && isFlagFlow && !awaitingConfirm && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={tryCloseTab}
                  className="inline-block w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Close Tab
                </button>
              </div>
            )}
            {awaitingConfirm && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleConfirmFlag(true)}
                  className="inline-block w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-white font-medium text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#E35153' }}
                >
                  Yes, flag inactive
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmFlag(false)}
                  className="inline-block w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  No, cancel
                </button>
              </div>
            )}
            {showCloseHint && (
              <p className="text-xs text-gray-500 mt-3">
                Your browser may block automatic tab closing. You can close it manually.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-5 py-3 sm:px-6 sm:py-4 md:px-8 border-t border-gray-100">
            <p className="text-center text-[10px] sm:text-xs text-gray-400">
              &copy; 2026 CIM Amplify. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
