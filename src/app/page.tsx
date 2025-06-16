import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to Auto Job Application Agent
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Your personal assistant for finding and applying to remote job opportunities.
          We automatically search multiple job boards and help you apply with just one click.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/jobs"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4">Browse Jobs</h2>
            <p className="text-gray-600">
              View the latest remote job listings from multiple sources and apply easily.
            </p>
          </Link>

          <Link
            href="/profile"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4">Setup Profile</h2>
            <p className="text-gray-600">
              Upload your resume and set your job preferences to streamline the application process.
            </p>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Automatic Search</h3>
              <p className="text-gray-600">
                We continuously scan multiple job boards for remote opportunities matching your criteria.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">2. One-Click Apply</h3>
              <p className="text-gray-600">
                Apply to jobs instantly with your pre-configured resume and application settings.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">3. Track Progress</h3>
              <p className="text-gray-600">
                Keep track of your applications and get notified of new matching opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
