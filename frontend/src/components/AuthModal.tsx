import { useState, useEffect, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
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
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close auth modal"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <img src="/assets/images/logo.jpeg" alt="CampusLend" className="h-full w-full object-cover" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">CampusLend</h2>
          <p className="mt-1 text-sm text-slate-500">Share more. Carry less.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`rounded-lg py-2.5 text-sm font-bold transition ${
              mode === 'login' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`rounded-lg py-2.5 text-sm font-bold transition ${
              mode === 'signup' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign up
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-slate-900">
          {mode === 'login' ? 'Welcome back' : 'Join your campus'}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {mode === 'login'
            ? 'Find the things you need, right where you live.'
            : 'Create an account to lend and borrow with ease.'}
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Email</label>
            <input
              type="email"
              placeholder="john@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
            />
          </div>

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <LoaderCircle size={17} className="animate-spin" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          By continuing, you agree to keep your campus community safe and respectful.
        </p>
      </div>
    </div>
  );
}
