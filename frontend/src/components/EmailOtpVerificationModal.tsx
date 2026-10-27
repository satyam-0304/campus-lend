import { useState, useEffect } from 'react';
import { Mail, Check, X, LoaderCircle, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';

interface EmailOtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
  showToast: (msg: string) => void;
}

export function EmailOtpVerificationModal({
  isOpen,
  email,
  onClose,
  onVerified,
  showToast,
}: EmailOtpVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [error, setError] = useState('');

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (!isOpen || !email) return;
    setOtp('');
    setError('');
    setResendCooldown(30);

    let isMounted = true;
    (async () => {
      try {
        await api.sendOtp(email);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to send verification email');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, email]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(email, otp.trim());
      if (res.verified) {
        showToast('Email verified successfully! 🎉');
        onVerified();
        onClose();
      } else {
        setError(res.message || 'Invalid verification code');
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
    try {
      await api.sendOtp(email);
      setResendCooldown(30);
      showToast('New verification PIN sent to your email');
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
              className="w-full text-center tracking-[14px] text-2xl font-black rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 py-3 px-6 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
            Confirm PIN & Activate
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            disabled={resendCooldown > 0 || resending}
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 disabled:opacity-50 transition"
          >
            <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
          </button>
        </div>
      </div>
    </div>
  );
}
