import { NextResponse } from 'next/server';
import { groqClient } from '@/lib/groqClient';
import nodemailer from 'nodemailer';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore: number;
  applyUrl: string;
  source: string;
  postedDate: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  remote: boolean;
}

interface ResumeData {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationDate: string;
    field: string;
  }>;
  jobPreferences: {
    desiredRole: string;
    desiredLocation: string;
    salaryRange: {
      min: number;
      max: number;
    };
    remotePreference: 'remote' | 'hybrid' | 'onsite';
  };
}

interface ApplicationRequest {
  jobs: Job[];
  resumeData: ResumeData;
}

interface ApplicationResult {
  jobId: string;
  success: boolean;
  method: 'email' | 'api' | 'link';
  error?: string;
  coverLetter?: string;
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function generateCoverLetter(job: Job, resumeData: ResumeData): Promise<string> {
  const completion = await groqClient.chat([
    {
      role: 'system',
      content: 'You are a professional cover letter writer who creates personalized, engaging cover letters.'
    },
    {
      role: 'user',
      content: `
        Generate a personalized cover letter for a job application with the following details:

        Job Details:
        - Title: ${job.title}
        - Company: ${job.company}
        - Description: ${job.description}

        Candidate Details:
        - Skills: ${resumeData.skills.join(', ')}
        - Experience: ${resumeData.experience.map(exp => `${exp.title} at ${exp.company}`).join(', ')}
        - Education: ${resumeData.education.map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ')}

        Requirements:
        1. Write in a professional but conversational tone
        2. Highlight relevant skills and experience that match the job requirements
        3. Show enthusiasm for the role and company
        4. Keep it concise (max 300 words)
        5. Match the language of the job posting (if it's in Portuguese, write in Portuguese)
        6. Include a clear call to action at the end

        Return only the cover letter text, no additional formatting or notes.
      `
    }
  ], {
    temperature: 0.7,
    max_tokens: 1000
  });

  return completion.choices[0].message.content;
}

async function extractEmailFromJobDescription(description: string): Promise<string | null> {
  const completion = await groqClient.chat([
    {
      role: 'system',
      content: 'You are a helpful assistant that extracts email addresses from text. You only return the email address or null.'
    },
    {
      role: 'user',
      content: `
        Extract the email address for job applications from this job description.
        If multiple email addresses are found, return the one most likely to be for job applications.
        If no email address is found, return null.
        Return ONLY the email address or null, no other text.

        Job Description:
        ${description}
      `
    }
  ], {
    temperature: 0.1,
    max_tokens: 100
  });

  const result = completion.choices[0].message.content.trim();
  return result === 'null' ? null : result;
}

async function applyToJob(job: Job, resumeData: ResumeData): Promise<ApplicationResult> {
  try {
    // Generate cover letter
    const coverLetter = await generateCoverLetter(job, resumeData);

    // Try to find application email in job description
    const applicationEmail = await extractEmailFromJobDescription(job.description);

    if (applicationEmail) {
      // Send application via email
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: applicationEmail,
        subject: `Application for ${job.title} position`,
        text: coverLetter,
        attachments: [
          {
            filename: 'resume.pdf',
            content: Buffer.from(resumeData.toString()) // This needs to be updated to handle actual resume file
          }
        ]
      });

      return {
        jobId: job.id,
        success: true,
        method: 'email',
        coverLetter
      };
    } else {
      // If no email found, return the cover letter and link to apply manually
      return {
        jobId: job.id,
        success: true,
        method: 'link',
        coverLetter,
      };
    }
  } catch (error) {
    console.error(`Error applying to job ${job.id}:`, error);
    return {
      jobId: job.id,
      success: false,
      method: 'link',
      error: error instanceof Error ? error.message : 'Failed to apply to job'
    };
  }
}

export async function POST(request: Request) {
  try {
    const { jobs, resumeData }: ApplicationRequest = await request.json();

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'No jobs provided for application' },
        { status: 400 }
      );
    }

    if (!resumeData) {
      return NextResponse.json(
        { error: 'No resume data provided' },
        { status: 400 }
      );
    }

    // Apply to each job in parallel
    const results = await Promise.all(
      jobs.map(job => applyToJob(job, resumeData))
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in job application:', error);
    return NextResponse.json(
      { error: 'Failed to process job applications' },
      { status: 500 }
    );
  }
} 