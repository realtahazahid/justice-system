'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scale, Loader2, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email address or password. Please try again.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-amber-500/10 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[8rem] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
            <Scale className="h-10 w-10 text-slate-950" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Sahi Law Chamber
          </h1>
          <p className="mt-2 text-sm text-slate-400 text-center font-medium">
            Supreme Court Legal Case Management System
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">
            Advocate Portal Access
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Advocate Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@sahilaw.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Secure Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/15 hover:shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Secure Log In'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-6">
            <div className="bg-slate-950/50 border border-slate-800/40 rounded-xl p-3 text-center">
              <span className="text-xs text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
                First Time Setup
              </span>
              <p className="text-xs text-slate-400 font-medium">
                Log in with <strong className="text-amber-400">admin@sahilaw.com</strong> & <strong className="text-amber-400">admin123</strong> to automatically seed your secure database.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600 font-medium">
          Confidential System &bull; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
