# Auto Job Application

An AI-powered job application assistant that helps you find and apply to remote jobs automatically.

## Features

- Upload your resume (PDF or Word format)
- AI-powered resume analysis
- Automatic job matching from multiple sources
- Smart cover letter generation
- Automatic job application via email when possible
- Support for multiple languages (matches job posting language)

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Groq LLM API
- Cheerio for web scraping
- Nodemailer for email sending

## Prerequisites

- Node.js 18+
- pnpm
- Groq API key
- SMTP server for sending applications

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/autoapplication.git
   cd autoapplication
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment variables example file:
   ```bash
   cp src/env.example .env.local
   ```

4. Update the environment variables in `.env.local` with your:
   - Groq API key
   - SMTP server configuration

## Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Visit the homepage and upload your resume (PDF or Word format, max 5MB)
2. The AI will analyze your resume and find matching jobs
3. Review the matched jobs and select the ones you want to apply to
4. Click "Apply" to generate personalized cover letters and submit applications
5. For jobs without direct email application, you'll receive the cover letter and a link to apply manually

## Job Sources

Currently supports scraping from:
- WeWorkRemotely
- Remotive

More sources will be added in future updates.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
