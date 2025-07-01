import Groq from 'groq-sdk';
import { ResumeData } from './resumeParser';

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
 * Gera uma carta de apresentação personalizada usando Groq API
 */
export async function generateCoverLetter(
  resumeData: ResumeData,
  jobData: JobData
): Promise<string> {
  try {
    const prompt = buildCoverLetterPrompt(resumeData, jobData);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em criar cartas de apresentação profissionais e persuasivas. 
          Sua tarefa é gerar uma carta de apresentação personalizada que conecte as habilidades e experiências 
          do candidato com os requisitos da vaga. A carta deve ser concisa (máximo 200 palavras), profissional 
          e focada em demonstrar valor para a empresa.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 500,
    });

    const coverLetter = completion.choices[0]?.message?.content || '';
    
    // Limita a 200 palavras
    return limitToWords(coverLetter, 200);
  } catch (error) {
    console.error('Erro ao gerar carta de apresentação:', error);
    throw new Error('Falha ao gerar carta de apresentação');
  }
}

/**
 * Constrói o prompt para a carta de apresentação
 */
function buildCoverLetterPrompt(resumeData: ResumeData, jobData: JobData): string {
  const skillsText = resumeData.skills.join(', ');
  const experienceText = resumeData.experience
    .map(exp => `${exp.title} na ${exp.company} (${exp.duration})`)
    .join('; ');
  
  const requirementsText = jobData.requirements?.join(', ') || 'não especificados';
  
  return `
Crie uma carta de apresentação profissional para a vaga de ${jobData.title} na empresa ${jobData.company}.

DADOS DO CANDIDATO:
- Nome: ${resumeData.name}
- Email: ${resumeData.email}
- Localização: ${resumeData.location || 'não especificada'}
- Habilidades principais: ${skillsText}
- Experiências: ${experienceText}
- Resumo: ${resumeData.summary || 'não disponível'}

DADOS DA VAGA:
- Título: ${jobData.title}
- Empresa: ${jobData.company}
- Localização: ${jobData.location || 'remota'}
- Salário: ${jobData.salary || 'não especificado'}
- Requisitos: ${requirementsText}
- Descrição: ${jobData.description.substring(0, 500)}...

INSTRUÇÕES:
1. A carta deve ter no máximo 200 palavras
2. Deve ser personalizada e específica para esta vaga
3. Deve destacar as habilidades relevantes do candidato
4. Deve mostrar entusiasmo e interesse genuíno pela empresa
5. Deve incluir uma chamada para ação clara
6. Use um tom profissional mas acessível
7. Evite clichês e frases genéricas

Formato da carta:
- Saudação personalizada
- Introdução com interesse na vaga
- Conecte experiências/habilidades com requisitos
- Demonstre conhecimento da empresa
- Encerramento com chamada para ação
- Assinatura com nome completo
`;
}

/**
 * Limita o texto a um número máximo de palavras
 */
function limitToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Gera um assunto personalizado para o email
 */
export function generateEmailSubject(resumeData: ResumeData, jobData: JobData): string {
  return `Candidatura para ${jobData.title} - ${resumeData.name}`;
}

/**
 * Gera um resumo da candidatura para logging
 */
export function generateApplicationSummary(
  resumeData: ResumeData,
  jobData: JobData,
  coverLetter: string
): string {
  return `
Candidatura Enviada:
- Candidato: ${resumeData.name} (${resumeData.email})
- Vaga: ${jobData.title} na ${jobData.company}
- Data: ${new Date().toLocaleString('pt-BR')}
- Tamanho da carta: ${coverLetter.split(/\s+/).length} palavras
- Habilidades relevantes: ${resumeData.skills.filter(skill => 
    jobData.description.toLowerCase().includes(skill.toLowerCase())
  ).join(', ')}
`;
} 