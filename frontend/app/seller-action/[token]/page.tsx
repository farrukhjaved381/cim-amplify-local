'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ShieldAlert, X, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ActionState = 'loading' | 'success' | 'already_done' | 'error';

const AUTO_CLOSE_SECONDS = 5;
const ALREADY_DONE_AUTO_CLOSE_SECONDS = 3;

type EmailAction = 'loi' | 'off-market' | 'flag-inactive';

type Buyer = {
  _id: string;
  fullName?: string;
  companyName?: string;
  email?: string;
};

type SubmitPayload = {
  buyerFromCIM?: boolean;
  winningBuyerId?: string;
  loiBuyerId?: string;
  finalSalePrice?: number;
};

const formatWithCommas = (value: string | number) => {
  const numeric = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value;
  if (Number.isNaN(numeric)) return '';
  return numeric.toLocaleString();
};

export default function SellerActionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  const action = searchParams?.get('action') as EmailAction | null;

  const [state, setState] = useState<ActionState>('loading');
  const [message, setMessage] = useState('');
  const [showDialog, setShowDialog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Off Market flow state
  const [offMarketStep, setOffMarketStep] = useState<1 | 2 | 3>(1);
  const [transactionValue, setTransactionValue] = useState('');

  // Buyer selection state (shared between LOI and Off Market)
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');

  // Auto-close countdown after a final action completes.
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);
  const [showCloseHint, setShowCloseHint] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const dialogTone = useMemo(() => {
    if (action === 'off-market' || action === 'flag-inactive') return '#E35153';
    return '#3AAFA9';
  }, [action]);

  // Pre-check token status on mount so a previously-used token short-circuits
  // straight to "Action Already Taken" instead of re-prompting the user.
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    if (!token || !action) {
      setState('error');
      setMessage('Invalid link. Please check the link in your email and try again.');
      setShowDialog(false);
      setTokenChecked(true);
      return;
    }

    if (!['loi', 'off-market', 'flag-inactive'].includes(action)) {
      setState('error');
      setMessage('Invalid action. The link may be malformed.');
      setShowDialog(false);
      setTokenChecked(true);
      return;
    }

    if (action === 'flag-inactive') {
      setMessage('Do you want to mark this buyer as inactive for this deal? This will only affect this one buyer on this one deal.');
    }

    let cancelled = false;

    fetch(`${apiUrl}/deals/email-action/${token}/status`)
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          // Treat 4xx as invalid link; let the action POST fail later if it's a transient error.
          if (response.status === 404 || response.status === 400) {
            const data = await response.json().catch(() => ({}));
            setState('error');
            setMessage(data.message || 'This link is invalid or has expired.');
            setShowDialog(false);
          }
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (data?.used) {
          setState('already_done');
          setMessage(data.message || 'You have already taken this action.');
          setShowDialog(false);
        }
      })
      .catch(() => {
        // Ignore network errors here; the user can still try the action and
        // the POST will surface any backend-side error.
      })
      .finally(() => {
        if (!cancelled) setTokenChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, token, action]);

  // Fetch buyers for LOI / Off Market dialogs scoped to the action token (no auth).
  useEffect(() => {
    const needsBuyerList =
      (action === 'loi') ||
      (action === 'off-market' && offMarketStep === 3);

    if (!token || !needsBuyerList) return;

    let cancelled = false;
    setBuyersLoading(true);
    setSelectedBuyerId('');
    fetch(`${apiUrl}/deals/email-action/${token}/buyers`)
      .then(async (response) => {
        if (!response.ok) return [] as Buyer[];
        const data = await response.json();
        return Array.isArray(data) ? (data as Buyer[]) : [];
      })
      .catch(() => [] as Buyer[])
      .then((list) => {
        if (cancelled) return;
        setBuyers(list);
      })
      .finally(() => {
        if (!cancelled) setBuyersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, token, action, offMarketStep]);

  // Try to close the tab; show a hint if the browser blocks it.
  const closeTab = () => {
    window.close();
    window.setTimeout(() => setShowCloseHint(true), 250);
  };

  // After a successful final submit (or detected already-used token), start a
  // countdown then close the tab. Already-done tabs close faster (3s) since
  // the user has nothing to confirm.
  useEffect(() => {
    if (state !== 'success' && state !== 'already_done') return;
    const seconds = state === 'already_done' ? ALREADY_DONE_AUTO_CLOSE_SECONDS : AUTO_CLOSE_SECONDS;
    setCloseCountdown(seconds);
    const interval = window.setInterval(() => {
      setCloseCountdown((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          window.clearInterval(interval);
          closeTab();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state]);

  const submitAction = async (payload: SubmitPayload = {}) => {
    if (!token || !action) return;
    try {
      setIsSubmitting(true);
      const response = await fetch(`${apiUrl}/deals/email-action/${token}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setState('success');
        setMessage(data.message || 'Action completed successfully.');
        setShowDialog(false);
      } else {
        setState('error');
        setMessage(data.message || 'Something went wrong. Please try again later.');
        setShowDialog(false);
      }
    } catch {
      setState('error');
      setMessage('Unable to connect to the server. Please try again later.');
      setShowDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setState('already_done');
    setMessage('No changes were made.');
  };

  // Off Market handlers
  const handleDealSoldResponse = async (sold: boolean) => {
    if (sold) {
      setOffMarketStep(2);
      return;
    }
    await submitAction({ buyerFromCIM: false });
  };

  const handleOffMarketConfirmCim = async () => {
    if (!selectedBuyerId) return;
    const numeric = transactionValue ? Number.parseFloat(transactionValue.replace(/,/g, '')) : undefined;
    await submitAction({
      buyerFromCIM: true,
      winningBuyerId: selectedBuyerId,
      finalSalePrice: numeric,
    });
  };

  const handleOffMarketNotFromCim = async () => {
    const numeric = transactionValue ? Number.parseFloat(transactionValue.replace(/,/g, '')) : undefined;
    await submitAction({
      buyerFromCIM: false,
      finalSalePrice: numeric,
    });
  };

  // LOI handlers
  const handleLoiPauseFromCim = async () => {
    if (!selectedBuyerId) return;
    await submitAction({ buyerFromCIM: true, loiBuyerId: selectedBuyerId });
  };

  const handleLoiNotFromCim = async () => {
    await submitAction({ buyerFromCIM: false });
  };

  // Render the structured LOI / Off Market interactive content
  const renderInteractiveContent = () => {
    if (action === 'flag-inactive') {
      return (
        <div className="px-6 pb-8 text-center">
          <p className="text-sm leading-relaxed text-gray-600 mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              type="button"
              onClick={() => submitAction({})}
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium text-sm hover:opacity-90"
              style={{ backgroundColor: dialogTone }}
            >
              Yes, flag inactive
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
        </div>
      );
    }

    if (action === 'loi') {
      return (
        <div className="px-6 pb-8">
          <p className="text-sm text-gray-500 text-center mb-4">Choose the LOI buyer for this deal</p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {buyersLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="w-10 h-10 rounded-full border-[3px] border-teal-200 border-t-teal-500 animate-spin mb-3" />
                <span className="text-sm font-medium">Loading buyers...</span>
              </div>
            ) : buyers.length > 0 ? (
              buyers.map((buyer) => (
                <button
                  type="button"
                  key={buyer._id}
                  onClick={() => setSelectedBuyerId(buyer._id)}
                  className={`w-full text-left flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedBuyerId === buyer._id
                      ? 'border-teal-400 bg-teal-50 shadow-md shadow-teal-100'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{buyer.fullName || 'Unknown Buyer'}</div>
                    <div className="text-xs text-gray-500 truncate">{buyer.companyName || 'Unknown Company'}</div>
                  </div>
                  {selectedBuyerId === buyer._id && (
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No buyers have interacted with this deal yet.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleLoiPauseFromCim}
              disabled={!selectedBuyerId || isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pause for LOI'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLoiNotFromCim}
              disabled={isSubmitting}
              className="w-full py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'No, not from CIM Amplify'
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (action === 'off-market') {
      if (offMarketStep === 1) {
        return (
          <div className="px-6 pb-8 text-center">
            <p className="text-sm text-gray-500 mb-6">Let us know the outcome of this deal</p>
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                onClick={() => handleDealSoldResponse(false)}
                disabled={isSubmitting}
                className="px-10 py-3 rounded-xl font-semibold bg-white text-red-500 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'No'}
              </Button>
              <Button
                type="button"
                onClick={() => handleDealSoldResponse(true)}
                disabled={isSubmitting}
                className="px-10 py-3 rounded-xl font-semibold bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-200 disabled:opacity-70"
              >
                Yes
              </Button>
            </div>
          </div>
        );
      }

      if (offMarketStep === 2) {
        return (
          <div className="px-6 pb-8">
            <p className="text-sm text-gray-500 text-center mb-4">What was the final transaction value?</p>
            <div className="space-y-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                <Input
                  value={transactionValue && transactionValue !== '0' ? formatWithCommas(transactionValue) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (/^\d*\.?\d*$/.test(raw)) {
                      setTransactionValue(raw);
                    }
                  }}
                  placeholder="0"
                  inputMode="decimal"
                  className="pl-8 pr-4 py-3 text-lg font-semibold rounded-xl border-gray-200 focus:border-teal-300 focus:ring-teal-200"
                />
              </div>
              <Button
                type="button"
                onClick={() => setOffMarketStep(3)}
                disabled={!transactionValue}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200"
              >
                Continue
              </Button>
            </div>
          </div>
        );
      }

      // step 3: buyer selection
      return (
        <div className="px-6 pb-8">
          <p className="text-sm text-gray-500 text-center mb-4">Choose the winning buyer for this deal</p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {buyersLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <div className="w-10 h-10 rounded-full border-[3px] border-teal-200 border-t-teal-500 animate-spin mb-3" />
                <span className="text-sm font-medium">Loading buyers...</span>
              </div>
            ) : buyers.length > 0 ? (
              buyers.map((buyer) => (
                <button
                  type="button"
                  key={buyer._id}
                  onClick={() => setSelectedBuyerId(buyer._id)}
                  className={`w-full text-left flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedBuyerId === buyer._id
                      ? 'border-teal-400 bg-teal-50 shadow-md shadow-teal-100'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-white font-bold text-sm">
                      {(buyer.fullName || 'B').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{buyer.fullName || 'Unknown Buyer'}</div>
                      <div className="text-xs text-gray-500 truncate">{buyer.companyName || 'Unknown Company'}</div>
                    </div>
                  </div>
                  {selectedBuyerId === buyer._id && (
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 ml-3">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No buyers have interacted with this deal yet.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              onClick={handleOffMarketConfirmCim}
              disabled={!selectedBuyerId || isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl font-semibold shadow-lg shadow-teal-200/50 transition-all duration-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Selection'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleOffMarketNotFromCim}
              disabled={isSubmitting}
              className="w-full py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buyer not from CIM Amplify'
              )}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Decide which dialog title to show before submission (replaces "Please Confirm").
  const interactiveTitle = (() => {
    if (action === 'flag-inactive') return 'Please Confirm';
    if (action === 'loi') return 'Select The Buyer';
    if (action === 'off-market') {
      if (offMarketStep === 1) return 'Did the deal sell?';
      if (offMarketStep === 2) return 'Transaction Value';
      return 'Select the Buyer';
    }
    return 'Please Confirm';
  })();

  const showFinalCard = !showDialog && state !== 'loading';

  // Headline / icon / accent for the final success / error / cancelled card.
  const finalCardConfig = (() => {
    if (state === 'success') {
      const successTitle =
        action === 'loi'
          ? 'Deal Paused for LOI'
          : action === 'off-market'
            ? 'Deal Taken Off Market'
            : action === 'flag-inactive'
              ? 'Buyer Flagged Inactive'
              : 'Action Completed';
      return {
        title: successTitle,
        accent: '#3AAFA9',
        bg: 'bg-emerald-50',
        ring: 'ring-emerald-100',
        icon: <CheckCircle className="h-9 w-9 text-[#3AAFA9]" />,
      };
    }
    if (state === 'error') {
      return {
        title: 'Something Went Wrong',
        accent: '#E35153',
        bg: 'bg-red-50',
        ring: 'ring-red-100',
        icon: <XCircle className="h-9 w-9 text-[#E35153]" />,
      };
    }
    if (state === 'already_done') {
      return {
        title: 'Action Already Taken',
        accent: '#3B82F6',
        bg: 'bg-blue-50',
        ring: 'ring-blue-100',
        icon: <CheckCircle className="h-9 w-9 text-blue-500" />,
      };
    }
    return {
      title: 'No Changes Made',
      accent: '#6B7280',
      bg: 'bg-slate-50',
      ring: 'ring-slate-100',
      icon: <Info className="h-9 w-9 text-slate-500" />,
    };
  })();

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 py-6 font-poppins">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <img src="/illustration.png" alt="CIM Amplify" className="h-20 w-auto mx-auto" />
        </div>

        {!showFinalCard && !tokenChecked && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-100">
            <div className="h-2" style={{ backgroundColor: '#6B7280' }} />
            <div className="px-6 sm:px-8 py-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
              <h2 className="text-lg font-semibold text-[#2f2b43] mb-1">Verifying link...</h2>
              <p className="text-sm text-gray-500">One moment, please.</p>
            </div>
          </div>
        )}

        {!showFinalCard && tokenChecked && (
          <Dialog open={showDialog}>
            <DialogContent
              className="sm:max-w-md rounded-2xl border-0 shadow-2xl overflow-hidden [&>button]:hidden"
              onEscapeKeyDown={(e) => e.preventDefault()}
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
            >
              <div className="h-2" style={{ backgroundColor: dialogTone }} />
              <DialogHeader className="text-center px-6 pt-8 pb-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-sm">
                  {isSubmitting ? (
                    <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 text-[#E35153]" />
                  )}
                </div>
                <DialogTitle className="text-2xl font-semibold text-[#2f2b43]">
                  {isSubmitting ? 'Processing your request...' : interactiveTitle}
                </DialogTitle>
              </DialogHeader>

              {isSubmitting ? (
                <div className="px-6 pb-8 text-center">
                  <p className="text-sm leading-relaxed text-gray-600 mb-6">
                    Please wait while we process your action...
                  </p>
                </div>
              ) : (
                renderInteractiveContent()
              )}
            </DialogContent>
          </Dialog>
        )}

        {showFinalCard && (
          <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ${finalCardConfig.ring}`}>
            <div className="h-2" style={{ backgroundColor: finalCardConfig.accent }} />
            <div className="px-6 sm:px-8 py-8 sm:py-10 text-center">
              <div
                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${finalCardConfig.bg}`}
              >
                {finalCardConfig.icon}
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#2f2b43] mb-2">
                {finalCardConfig.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 mb-6">{message}</p>

              {(state === 'success' || state === 'already_done') && closeCountdown !== null && closeCountdown > 0 && (
                <p className="text-xs text-gray-500 mb-4">
                  This tab will close automatically in {closeCountdown} second{closeCountdown === 1 ? '' : 's'}...
                </p>
              )}

              <button
                type="button"
                onClick={closeTab}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Close Tab
              </button>

              {showCloseHint && (
                <p className="text-xs text-gray-400 mt-3">
                  Your browser may block automatic tab closing. You can close it manually.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
