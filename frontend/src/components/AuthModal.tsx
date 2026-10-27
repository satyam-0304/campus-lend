import { useState, useEffect, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isValidPecEmail, parsePecEmail } from '../lib/pecEmail';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess: (msg: string) => void;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidPecEmail(cleanEmail)) {
      setError('Access restricted: Please use your official @pec.edu.in institute email.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const parsed = parsePecEmail(cleanEmail);
        const fullName = name.trim() || parsed.formattedName;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              degree: parsed.degree,
              batch_year: parsed.batchYear,
              branch: parsed.branchName || parsed.branchCode,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          onSuccess('Account created — welcome to CampusLend');
          onClose();
        } else {
          setError('Signup failed. Please try again.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
        onSuccess('Logged in');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Network error — please check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-md rounded-3xl bg-white p-5 sm:p-8 shadow-2xl ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800 transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          aria-label="Close auth modal"
        >
          <X size={20} />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">CampusLend</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Share more. Carry less.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`min-h-[42px] rounded-lg py-2 text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-700 dark:text-sky-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`min-h-[42px] rounded-lg py-2 text-sm font-bold transition ${
              mode === 'signup'
                ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-700 dark:text-sky-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Sign up
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
          {mode === 'login' ? 'Welcome back' : 'Join your campus'}
        </h3>
        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {mode === 'login'
            ? 'Find the things you need, right where you live.'
            : 'Create an account to lend and borrow with ease.'}
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">PEC Email</label>
            <input
              type="email"
              placeholder="student.bt24cse@pec.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          <button
            disabled={loading}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <LoaderCircle size={17} className="animate-spin" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="mt-4 sm:mt-5 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
          By continuing, you agree to keep your campus community safe and respectful.
        </p>
        </div>
      </div>
    </div>
  );
}
