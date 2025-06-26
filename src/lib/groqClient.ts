import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

class GroqClient {
  static cleanJsonResponse(content: string): string {
    // Remove code block markers if present
    content = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    
    // Remove any leading/trailing whitespace
    content = content.trim();
    
    // If the content starts with a newline and {, remove everything before the {
    content = content.replace(/^[\s\S]*?({)/, '$1');
    
    // If the content has trailing text after the last }, remove it
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace !== -1) {
      content = content.substring(0, lastBrace + 1);
    }
    
    // Ensure the JSON is properly balanced
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      content += '}'.repeat(openBraces - closeBraces);
    }
    
    return content;
  }

  private async extractStructuredData(text: string, prompt: string): Promise<any> {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a resume parser that returns only JSON. No explanations or markdown.`
        },
        {
          role: 'user',
          content: `${prompt}\n\nText to analyze:\n${text}`
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.1,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq');
    }

    try {
      const cleanedContent = GroqClient.cleanJsonResponse(content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse JSON response. Raw content:', content);
      console.error('Cleaned content:', GroqClient.cleanJsonResponse(content));
      throw new Error('Invalid JSON response from Groq: ' + (error as Error).message);
    }
  }

  async analyzeResume(resumeText: string): Promise<ResumeData> {
    const prompt = `
      Parse this resume into JSON with this structure:
      {
        "skills": string[],
        "experience": [{"title": string, "company": string, "startDate": "YYYY-MM", "endDate": "YYYY-MM", "description": string}],
        "education": [{"degree": string, "institution": string, "graduationDate": "YYYY-MM", "field": string}],
        "jobPreferences": {
          "desiredRole": string,
          "desiredLocation": string,
          "salaryRange": {"min": number, "max": number},
          "remotePreference": "remote" | "hybrid" | "onsite"
        }
      }

      Extract:
      1. ALL technical and soft skills from entire resume
      2. ALL work experience with full descriptions
      3. ALL education details
      4. Infer job preferences from recent roles
      
      Return ONLY valid JSON.
    `;

    return await this.extractStructuredData(resumeText, prompt) as ResumeData;
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages,
      model: options.model || 'mixtral-8x7b-32768',
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      top_p: options.top_p || 1,
      stream: false
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq');
    }

    return content;
  }
}

export const groqClient = new GroqClient();

export async function findMatchingJobs(resumeData: string) {
  console.log('=== Starting job matching with Groq ===');
  try {
    console.log('Sending job matching request to Groq...');
    console.log('Resume data length:', resumeData.length);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a job matching expert. Generate 5 relevant job matches in JSON format only."
        },
        {
          role: "user",
          content: `Based on this resume data, generate 5 job matches as JSON array:
          ${resumeData}
          
          Return array of:
          {
            "title": string,
            "company": string,
            "location": string,
            "description": string,
            "matchScore": number (0-100)
          }`
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq');
    }

    try {
      const cleanedContent = GroqClient.cleanJsonResponse(content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse job matches JSON:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in findMatchingJobs:', error);
    throw error;
  }
} 