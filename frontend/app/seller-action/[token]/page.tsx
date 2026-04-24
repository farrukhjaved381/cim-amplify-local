'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ActionState = 'loading' | 'success' | 'already_done' | 'error';

export default function SellerActionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  const action = searchParams?.get('action') as 'loi' | 'off-market' | 'flag-inactive' | null;

  const [state, setState] = useState<ActionState>('loading');
  const [message, setMessage] = useState('');
  const [showDialog, setShowDialog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogTone = useMemo(() => {
    if (action === 'off-market' || action === 'flag-inactive') return '#E35153';
    return '#3AAFA9';
  }, [action]);

  useEffect(() => {
    if (!token || !action) {
      setState('error');
      setMessage('Invalid link. Please check the link in your email and try again.');
      return;
    }

    if (!['loi', 'off-market', 'flag-inactive'].includes(action)) {
      setState('error');
      setMessage('Invalid action. The link may be malformed.');
      return;
    }

    if (action === 'flag-inactive') {
      setMessage('Do you want to mark this buyer as inactive for this deal? This will only affect this one buyer on this one deal.');
    } else if (action === 'loi') {
      setMessage('Do you want to pause this deal for LOI?');
    } else {
      setMessage('Do you want to take this deal off market?');
    }
  }, [token, action]);

  const handleAction = async () => {
    try {
      setIsSubmitting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/deals/email-action/${token}?action=${action}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setState('success');
        setMessage(data.message || 'Action completed successfully.');
        setShowDialog(false);
      } else {
        setState('error');
        setMessage(data.message || 'Something went wrong. Please try again later.');
      }
    } catch {
      setState('error');
      setMessage('Unable to connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setState('already_done');
    setMessage('No changes were made.');
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 py-6 font-poppins">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <img src="/illustration.png" alt="CIM Amplify" className="h-20 w-auto mx-auto" />
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl overflow-hidden">
            <div className="h-2" style={{ backgroundColor: dialogTone }} />
            <DialogHeader className="text-center px-6 pt-8 pb-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-sm">
                {isSubmitting ? (
                  <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
                ) : state === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-[#3AAFA9]" />
                ) : state === 'error' ? (
                  <XCircle className="h-8 w-8 text-[#E35153]" />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-[#E35153]" />
                )}
              </div>
              <DialogTitle className="text-2xl font-semibold text-[#2f2b43]">
                {isSubmitting
                  ? 'Processing your request...'
                  : state === 'success'
                    ? action === 'loi'
                      ? 'Deal Paused for LOI'
                      : action === 'off-market'
                        ? 'Deal Taken Off Market'
                        : 'Buyer Flagged Inactive'
                    : state === 'error'
                      ? 'Something Went Wrong'
                      : 'Please Confirm'}
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pb-8 text-center">
              <p className="text-sm leading-relaxed text-gray-600 mb-6">
                {isSubmitting ? 'Please wait while we process your action...' : message}
              </p>

              {showDialog && !isSubmitting && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    type="button"
                    onClick={handleAction}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium text-sm hover:opacity-90"
                    style={{ backgroundColor: dialogTone }}
                  >
                    {action === 'loi'
                      ? 'Yes, pause it'
                      : action === 'off-market'
                        ? 'Yes, take it off market'
                        : 'Yes, flag inactive'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
                  >
                    No, cancel
                  </Button>
                </div>
              )}

              {state !== 'loading' && !showDialog && (
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Close Tab
                </button>
              )}

              {state === 'success' && !showDialog && (
                <p className="text-xs text-gray-500 mt-3">
                  You can close this tab if it does not close automatically.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
