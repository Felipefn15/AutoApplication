'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow">
          <div className="container mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link
                  href="/"
                  className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900"
                >
                  <span className="text-xl font-bold">Job Agent</span>
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/jobs"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
                >
                  Jobs
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
}
