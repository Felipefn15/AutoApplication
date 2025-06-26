'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirectedFrom') || '/jobs';
  const supabase = createClient();

  // Check if we're coming from a guest session
  const guestSessionId = typeof window !== 'undefined' ? localStorage.getItem('guestSessionId') : null;

  useEffect(() => {
    // If we have a guest session, check if it's valid
    async function checkGuestSession() {
      if (!guestSessionId) return;

      try {
        const { data: session, error } = await supabase
          .from('guest_sessions')
          .select('applications_remaining')
          .eq('session_id', guestSessionId)
          .single();

        if (error || !session) {
          // Invalid or expired guest session, remove it
          localStorage.removeItem('guestSessionId');
        }
      } catch (error) {
        console.error('Error checking guest session:', error);
      }
    }

    checkGuestSession();
  }, [guestSessionId, supabase]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // If we had a guest session, we'll want to transfer the data
      if (guestSessionId) {
        try {
          // Get the guest session data
          const { data: guestData } = await supabase
            .from('guest_sessions')
            .select('*')
            .eq('session_id', guestSessionId)
            .single();

          if (guestData) {
            // Transfer guest data to user account
            // This would be implemented in your backend
            await fetch('/api/auth/transfer-guest-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                guestSessionId,
              }),
            });
          }

          // Clear the guest session
          localStorage.removeItem('guestSessionId');
        } catch (error) {
          console.error('Error transferring guest data:', error);
        }
      }

      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {guestSessionId && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to save your guest progress
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 