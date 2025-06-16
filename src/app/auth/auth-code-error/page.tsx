import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            There was a problem with the authentication process.
          </p>
        </div>
        <div className="mt-8">
          <p className="text-gray-600 mb-4">
            This could happen if:
          </p>
          <ul className="list-disc text-left pl-8 mb-8 text-gray-600">
            <li>The authentication link has expired</li>
            <li>You&apos;ve already used this authentication link</li>
            <li>The authentication link is invalid</li>
          </ul>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
} 