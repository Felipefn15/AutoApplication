import { NextRequest, NextResponse } from 'next/server';
import { scrapeJobs } from '@/lib/scraper';
import { parseResume, ResumeData } from '@/lib/resumeParser';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface JobData {
  title: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
  requirements?: string[];
  benefits?: string[];
  url: string;
  source: string;
  posted_at: string;
  skills: string[];
  employment_type?: string;
  experience_level?: string;
}

/**
 * Gera palavras-chave e localização a partir do currículo usando LLM
 */
async function extractKeywordsAndLocation(resumeData: ResumeData): Promise<{ keywords: string[], location: string }> {
  const prompt = `
A partir do seguinte perfil extraído de um currículo, gere:
- Uma lista de até 5 palavras-chave (tecnologias, cargos, áreas, skills) para busca de vagas
- A localização principal do candidato (cidade, estado ou país)

Retorne no formato JSON:
{
  "keywords": ["palavra1", "palavra2", ...],
  "location": "cidade ou país"
}

Perfil:
Nome: ${resumeData.name}
Email: ${resumeData.email}
Habilidades: ${resumeData.skills.join(', ')}
Experiências: ${resumeData.experience.map(exp => `${exp.title} na ${exp.company}`).join('; ')}
Localização: ${resumeData.location || 'não especificada'}
Resumo: ${resumeData.summary || 'não disponível'}
`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente que gera palavras-chave e localização para busca de vagas a partir de um currículo. Responda apenas com JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama3-8b-8192',
    temperature: 0.2,
    max_tokens: 200,
  });

  const response = completion.choices[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(response);
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      location: typeof parsed.location === 'string' ? parsed.location : ''
    };
  } catch (e) {
    console.warn('Resposta inválida do Groq para keywords/location:', response);
    return { keywords: resumeData.skills.slice(0, 5), location: resumeData.location || '' };
  }
}

/**
 * POST /api/jobs/scrape
 * Busca vagas remotas baseado no currículo do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'Arquivo de currículo é obrigatório' },
        { status: 400 }
      );
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB permitido.' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json(
        { error: 'Formato não suportado. Use PDF ou DOCX.' },
        { status: 400 }
      );
    }

    // 1. Parse do currículo
    const resumeData = await parseResume(resumeFile);
    // 2. Gerar palavras-chave e localização
    const { keywords, location } = await extractKeywordsAndLocation(resumeData);
    console.log('Palavras-chave extraídas:', keywords, 'Localização:', location);

    // 3. Buscar vagas já filtradas
    const scrapedJobs = await scrapeJobs({ keywords, location });
    console.log(`Encontradas ${scrapedJobs.length} vagas para keywords:`, keywords, 'e localização:', location);

    // 4. (Opcional) Filtrar/classificar com LLM
    // const relevantJobs = await filterRelevantJobs(scrapedJobs, resumeData);
    // console.log(`${relevantJobs.length} vagas relevantes encontradas`);

    return NextResponse.json({
      success: true,
      jobs: scrapedJobs,
      resumeData: {
        name: resumeData.name,
        email: resumeData.email,
        skills: resumeData.skills,
        experience: resumeData.experience
      },
      keywords,
      location
    });

  } catch (error) {
    console.error('Erro na busca de vagas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Filtra vagas relevantes usando Groq API
 */
async function filterRelevantJobs(
  jobs: any[],
  resumeData: ResumeData
): Promise<JobData[]> {
  try {
    const prompt = `
Analise as seguintes vagas e retorne apenas as que são relevantes para o candidato.
Considere as habilidades, experiências e perfil do candidato.

CANDIDATO:
- Nome: ${resumeData.name}
- Habilidades: ${resumeData.skills.join(', ')}
- Experiências: ${resumeData.experience.map(exp => `${exp.title} na ${exp.company}`).join('; ')}
- Resumo: ${resumeData.summary || 'não disponível'}

VAGAS DISPONÍVEIS:
${jobs.map((job, index) => `
${index + 1}. ${job.title} na ${job.company}
   Localização: ${job.location}
   Descrição: ${job.description.substring(0, 200)}...
   Habilidades detectadas: ${job.skills?.join(', ') || 'não especificadas'}
`).join('\n')}

INSTRUÇÕES:
1. Analise cada vaga considerando a compatibilidade com o perfil do candidato
2. Retorne apenas os números das vagas relevantes (ex: [1, 3, 5])
3. Considere relevante se:
   - O candidato tem pelo menos 50% das habilidades necessárias
   - A experiência do candidato é compatível com a vaga
   - A vaga é remota ou na localização do candidato
4. Máximo 10 vagas relevantes

Responda apenas com um array JSON de números, exemplo: [1, 3, 5]
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em matching de vagas. Analise as vagas e retorne apenas os números das vagas relevantes em formato JSON array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    let relevantIndexes: number[] = [];
    try {
      relevantIndexes = JSON.parse(response);
    } catch (e) {
      console.warn('Resposta inválida do Groq, retornando todas as vagas');
      return jobs.slice(0, 10).map(convertToJobData);
    }

    if (!Array.isArray(relevantIndexes)) {
      return jobs.slice(0, 10).map(convertToJobData);
    }

    return relevantIndexes
      .filter((index: number) => index >= 1 && index <= jobs.length)
      .map((index: number) => convertToJobData(jobs[index - 1]))
      .slice(0, 10);

  } catch (error) {
    console.error('Erro ao filtrar vagas com Groq:', error);
    // Fallback: retorna as primeiras 10 vagas
    return jobs.slice(0, 10).map(convertToJobData);
  }
}

/**
 * Converte job do scraper para JobData
 */
function convertToJobData(job: any): JobData {
  return {
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    salary: job.salary,
    url: job.url,
    source: job.source,
    posted_at: job.posted_at,
    skills: job.skills || [],
    employment_type: job.employment_type,
    experience_level: job.experience_level,
    requirements: extractRequirements(job.description),
    benefits: extractBenefits(job.description)
  };
}

/**
 * Extrai requisitos da descrição da vaga
 */
function extractRequirements(description: string): string[] {
  const requirements: string[] = [];
  const requirementKeywords = ['requisitos', 'requirements', 'qualificações', 'qualifications', 'precisamos', 'we need'];
  
  const lines = description.toLowerCase().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (requirementKeywords.some(keyword => line.includes(keyword))) {
      // Extrai as próximas linhas como requisitos
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const reqLine = lines[j].trim();
        if (reqLine && reqLine.length > 10 && !reqLine.includes('benefícios')) {
          requirements.push(reqLine);
        }
      }
      break;
    }
  }
  
  return requirements.slice(0, 5);
}

/**
 * Extrai benefícios da descrição da vaga
 */
function extractBenefits(description: string): string[] {
  const benefits: string[] = [];
  const benefitKeywords = ['benefícios', 'benefits', 'ofertamos', 'we offer', 'perks'];
  
  const lines = description.toLowerCase().split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (benefitKeywords.some(keyword => line.includes(keyword))) {
      // Extrai as próximas linhas como benefícios
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const benefitLine = lines[j].trim();
        if (benefitLine && benefitLine.length > 10) {
          benefits.push(benefitLine);
        }
      }
      break;
    }
  }
  
  return benefits.slice(0, 5);
} 