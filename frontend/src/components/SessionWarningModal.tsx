/**
 * SessionWarningModal
 *
 * Shown when the user has been idle for 30 minutes.
 * Counts down 2 minutes, then fires onTimeout.
 * "Stay logged in" resets the inactivity clock and closes the modal.
 */

import { useEffect, useRef, useState } from 'react';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';
import { resetInactivityTimestamp } from '../lib/useInactivityTimeout';

interface SessionWarningModalProps {
  isOpen: boolean;
  /** remaining ms until forced logout when the modal opens */
  warnMs?: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export function SessionWarningModal({
  isOpen,
  warnMs = 2 * 60 * 1000,
  onStayLoggedIn,
  onLogout,
}: SessionWarningModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warnMs / 1000));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset and start countdown whenever the modal opens
  useEffect(() => {
    if (!isOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSecondsLeft(Math.ceil(warnMs / 1000));
      return;
    }

    setSecondsLeft(Math.ceil(warnMs / 1000));

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, warnMs]);

  // When countdown reaches 0, trigger logout
  useEffect(() => {
    if (isOpen && secondsLeft === 0) {
      onLogout();
    }
  }, [isOpen, secondsLeft, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Fraction of warn window remaining (for the ring progress indicator)
  const totalSeconds = Math.ceil(warnMs / 1000);
  const fraction = secondsLeft / totalSeconds;
  // SVG circle math: r=28, circumference ≈ 176
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - fraction);
  const isUrgent = secondsLeft <= 30;

  const handleStay = () => {
    resetInactivityTimestamp();
    onStayLoggedIn();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-100 dark:ring-slate-800 p-7 text-center"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        aria-describedby="session-warning-desc"
      >
        {/* Countdown ring */}
        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            {/* Track */}
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-700" />
            {/* Progress */}
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={isUrgent ? '#f43f5e' : '#0ea5e9'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className={`flex flex-col items-center justify-center ${isUrgent ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
            <Clock size={18} className="mb-0.5" />
            <span className="text-lg font-extrabold leading-none tabular-nums">{formatted}</span>
          </div>
        </div>

        <ShieldCheck size={20} className="mx-auto mb-2 text-amber-500" />
        <h2
          id="session-warning-title"
          className="text-lg font-extrabold text-slate-900 dark:text-white"
        >
          Still there?
        </h2>
        <p
          id="session-warning-desc"
          className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
        >
          You've been inactive for a while. For your security, you'll be logged out automatically in{' '}
          <span className={`font-bold tabular-nums ${isUrgent ? 'text-rose-500' : 'text-sky-600 dark:text-sky-400'}`}>
            {formatted}
          </span>
          .
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleStay}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 active:scale-[0.99]"
          >
            <ShieldCheck size={16} />
            Stay logged in
          </button>
          <button
            onClick={onLogout}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99]"
          >
            <LogOut size={15} />
            Log out now
          </button>
        </div>
      </div>
    </div>
  );
}
