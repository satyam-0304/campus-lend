import { useState, useEffect } from 'react';
import { Check, X, LoaderCircle, RefreshCw, KeyRound, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface EmailOtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  isLoggedInUser?: boolean;
  onClose: () => void;
  onVerified: () => void;
  showToast: (msg: string) => void;
}

export function EmailOtpVerificationModal({
  isOpen,
  email,
  isLoggedInUser = false,
  onClose,
  onVerified,
  showToast,
}: EmailOtpVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if we have an active session in local storage or via props
  const hasAuthToken = typeof window !== 'undefined' && Boolean(
    localStorage.getItem('sb-wbbnqswauzhodnnbxodl-auth-token') ||
    document.cookie.includes('sb-')
  );
  const useLoggedInApi = isLoggedInUser || hasAuthToken;

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setOtp('');
    setError('');
    setIsSuccess(false);
    setResendCooldown(30);

    let isMounted = true;
    (async () => {
      try {
        if (useLoggedInApi) {
          const res = await api.sendUserOtp();
          if (res?.devOtp && isMounted) {
            setOtp(res.devOtp);
          }
          if (res?.cooldownSeconds && isMounted) {
            setResendCooldown(Math.min(30, res.cooldownSeconds));
          }
        } else if (email) {
          const res = await api.sendOtp(email);
          if (res?.devOtp && isMounted) {
            setOtp(res.devOtp);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          // If already verified or cooldown active, handle gracefully
          if (err?.message?.includes('already verified')) {
            showToast('Email is already verified! 🎉');
            onVerified();
            onClose();
          } else {
            setError(err?.message || 'Failed to dispatch verification email');
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, email, useLoggedInApi]);

  // 30-second Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (useLoggedInApi) {
        const res = await api.verifyUserOtp(cleanOtp);
        if (res.isEmailVerified || res.success) {
          setIsSuccess(true);
          showToast('Email verified successfully! 🎉');
          onVerified();
          // Auto-close after showing success state
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(res.message || 'Invalid verification code');
        }
      } else {
        const res = await api.verifyOtp(email, cleanOtp);
        if (res.verified || res.success) {
          setIsSuccess(true);
          showToast('Email verified successfully! 🎉');
          onVerified();
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(res.message || 'Invalid verification code');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setOtp('');
    try {
      if (useLoggedInApi) {
        const res = await api.sendUserOtp();
        if (res?.devOtp) setOtp(res.devOtp);
        setResendCooldown(30);
      } else {
        const res = await api.sendOtp(email);
        if (res?.devOtp) setOtp(res.devOtp);
        setResendCooldown(30);
      }
      showToast('New verification PIN sent to your PEC email 📧');
    } catch (err: any) {
      setError(err?.message || 'Could not resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          /* Prominent Success View */
          <div className="text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
              <Check size={36} className="stroke-[3]" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Email Verified Successfully! 🎉
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your official PEC webmail is confirmed. A verification confirmation email has been dispatched to your inbox.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  onVerified();
                  onClose();
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-98 transition"
              >
                <Sparkles size={16} />
                Continue to CampusLend
              </button>
            </div>
          </div>
        ) : (
          /* Normal Verification Form View */
          <>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <KeyRound size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Verify Your PEC Webmail
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                We sent a 6-digit confirmation PIN to:
              </p>
              <p className="mt-1 text-xs font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 py-1 px-3 rounded-full inline-block">
                {email}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full text-center tracking-[14px] text-2xl font-black rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 py-3 px-6 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:opacity-50"
              >
                {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
                {loading ? 'Verifying PIN...' : 'Verify & Activate'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                disabled={resendCooldown > 0 || resending}
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 disabled:opacity-50 transition"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending
                  ? 'Sending new code...'
                  : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend verification code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
