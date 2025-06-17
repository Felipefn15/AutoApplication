# Auto Job Application Agent

An automated job application system that helps you find and apply for remote jobs.

## Features

- User authentication with Supabase
  - Email/Password login
  - Google OAuth login
- Job scraping from multiple sources:
  - WeWorkRemotely
  - RemoteOK
  - GitHub Jobs
- Customizable job search preferences
- Resume upload and management
- Automated job application tracking

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/auto-job-application-agent.git
cd auto-job-application-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Set up your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Enable email authentication in the Auth settings
   - Run the SQL commands from `supabase/schema.sql` in the SQL editor

5. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google OAuth API
   - Create OAuth 2.0 credentials:
     - Application type: Web application
     - Add authorized redirect URIs:
       - `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
       - `http://localhost:3000/auth/callback` (for development)
   - Copy the Client ID and Client Secret to your `.env` file
   - In Supabase Dashboard:
     - Go to Authentication > Providers
     - Enable Google provider
     - Add your Google Client ID and Secret

6. Start the development server:
```bash
npm run dev
```

## Usage

1. Sign up for an account (via email or Google)
2. Set up your profile:
   - Add search keywords (e.g., "react", "typescript")
   - Add preferred job types (e.g., "full-time", "contract")
   - Upload your resume
3. Click "Find New Jobs" to start searching
4. Review and apply to jobs that match your preferences

## Development

The project uses:
- Next.js 13 with App Router
- Supabase for authentication and database
- Tailwind CSS for styling
- TypeScript for type safety

### Project Structure

```
src/
  ├── app/                 # Next.js app router pages
  │   ├── api/            # API routes
  │   ├── auth/           # Authentication pages
  │   ├── jobs/           # Job listing pages
  │   └── profile/        # Profile management pages
  ├── lib/                # Utility functions
  │   ├── scraper.ts      # Job scraping logic
  │   └── supabaseClient.ts # Supabase client setup
  └── types/              # TypeScript type definitions
```

### Authentication Flow

1. Users can sign up/log in using:
   - Email and password
   - Google OAuth
2. Supabase handles authentication and session management
3. A profile is automatically created for new users
4. All API routes and data access are protected by Row Level Security

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
