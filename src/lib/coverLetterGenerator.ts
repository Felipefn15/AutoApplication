import { Groq } from 'groq-sdk';
import { ResumeData } from './resumeParser';
import { Job } from './scraper';

// Validação do ambiente
function validateEnvironment() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada');
  }
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

async function retry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Log do erro e tentativa
    console.error(`Erro na tentativa (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
    console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

interface LanguageTemplate {
  greeting: string;
  closing: string;
  regards: string;
}

const TEMPLATES: Record<string, LanguageTemplate> = {
  en: {
    greeting: 'Dear Hiring Team',
    closing: 'Thank you for considering my application. I look forward to discussing how I can contribute to your team.',
    regards: 'Best regards'
  },
  pt: {
    greeting: 'Prezados',
    closing: 'Agradeço a atenção e fico à disposição para uma entrevista.',
    regards: 'Atenciosamente'
  },
  es: {
    greeting: 'Estimado equipo de selección',
    closing: 'Gracias por considerar mi candidatura. Espero poder discutir cómo puedo contribuir a su equipo.',
    regards: 'Cordialmente'
  }
};

/**
 * Detecta o idioma principal do texto
 */
async function detectLanguage(text: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Respond only with "en", "pt", or "es".'
        },
        {
          role: 'user',
          content: `Detect the main language of this text (respond only with en/pt/es):\n\n${text.substring(0, 500)}`
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      max_tokens: 10,
    });

    const detectedLang = completion.choices[0]?.message?.content?.trim().toLowerCase();
    return ['en', 'pt', 'es'].includes(detectedLang) ? detectedLang : 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en'; // Fallback to English
  }
}

/**
 * Calcula anos de experiência total
 */
function calculateTotalExperience(experience: any[]): number {
  let totalYears = 0;
  experience.forEach(exp => {
    const duration = exp.duration.toLowerCase();
    // Extrai números da string de duração
    const years = duration.match(/(\d+)\s*(?:year|ano)/i);
    const months = duration.match(/(\d+)\s*(?:month|mes|mês)/i);
    
    if (years) totalYears += parseInt(years[1]);
    if (months) totalYears += parseInt(months[1]) / 12;
  });
  return Math.round(totalYears);
}

/**
 * Extrai tecnologias únicas de todas as experiências
 */
function extractAllTechnologies(experience: any[]): string[] {
  const techSet = new Set<string>();
  experience.forEach(exp => {
    if (exp.technologies) {
      exp.technologies.forEach((tech: string) => techSet.add(tech));
    }
  });
  return Array.from(techSet);
}

/**
 * Gera uma carta de apresentação personalizada usando Groq API
 */
export async function generateCoverLetter(resume: ResumeData, job: Job): Promise<string> {
  // Valida ambiente primeiro
  validateEnvironment();

  // Detecta idioma da vaga
  const jobLang = await detectLanguage(job.description);
  console.log(`Detected job language: ${jobLang}`);
  
  // Usa anos de experiência calculados ou calcula se não disponível
  const totalYears = resume.totalYearsExperience || calculateTotalExperience(resume.experience);
  
  // Extrai todas as tecnologias das experiências
  const allTechnologies = extractAllTechnologies(resume.experience);
  
  // Pega a experiência mais recente
  const latestExperience = resume.experience[0];
  
  // Pega as principais conquistas/projetos
  const achievements = resume.experience
    .slice(0, 2)
    .map(exp => ({
      title: exp.title,
      company: exp.company,
      description: exp.description,
      technologies: exp.technologies,
      yearsInRole: exp.yearsInRole
    }));

  // Prepara experiência por tecnologia para o prompt
  const techExperience = resume.experienceByTechnology || {};
  const topTechnologies = Object.entries(techExperience)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tech, years]) => `${tech} (${years} anos)`)
    .join(', ');

  const template = TEMPLATES[jobLang];
  
  const prompt = `
You are an HR assistant specialized in cover letters. Generate a professional and personalized cover letter using the data below.
The cover letter MUST be in ${jobLang === 'en' ? 'English' : jobLang === 'pt' ? 'Portuguese' : 'Spanish'}.

CANDIDATE DATA:
Name: ${resume.name}
Total Years of Experience: ${totalYears} years
Current/Last Position: ${latestExperience?.title || 'Not informed'}
Key Skills: ${resume.skills.join(', ')}
Top Technologies with Experience: ${topTechnologies}

Recent Experience:
${achievements.map(exp => `- ${exp.title} at ${exp.company} (${exp.yearsInRole || 1} years)
  Description: ${exp.description || 'Not provided'}
  Technologies: ${exp.technologies?.join(', ') || 'Not specified'}`).join('\n')}

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description.substring(0, 600)}
Location: ${job.location || 'Remote'}

REQUIREMENTS:
1. Generate a complete, professional cover letter in ${jobLang === 'en' ? 'English' : jobLang === 'pt' ? 'Portuguese' : 'Spanish'}
2. Use a professional but warm tone
3. Structure in 4 clear paragraphs:
   - Introduction and interest in the position
   - Technical skills and alignment with requirements
   - Specific achievements and results
   - Interest in the company and call to action
4. Keep between 250-300 words
5. Include candidate's full name and specific experience details
6. Highlight relevant technologies and years of experience
7. Show enthusiasm and company knowledge
8. Use appropriate greetings and closings for the language
9. Include specific achievements and results from experience
10. Mention years of experience with specific technologies

Generate the complete letter now, maintaining proper formatting and language-specific conventions.`;

  try {
    console.log('🤖 Iniciando geração da carta via Groq...');
    console.log('📊 Dados do candidato para carta:', {
      name: resume.name,
      totalYears,
      topTechnologies,
      achievements: achievements.length
    });
    
    const completion = await retry(() => 
      groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an HR assistant specialized in cover letters. Generate professional cover letters in ${jobLang === 'en' ? 'English' : jobLang === 'pt' ? 'Portuguese' : 'Spanish'}. Always include candidate name and specific experience details with years of experience.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.3,
        max_tokens: 800,
      })
    );

    const coverLetter = completion.choices[0]?.message?.content?.trim();
    
    if (!coverLetter) {
      throw new Error('Resposta vazia da API Groq');
    }

    // Validações da carta gerada
    if (coverLetter.length < 100) {
      throw new Error('Carta de apresentação muito curta');
    }

    if (!coverLetter.includes(resume.name)) {
      throw new Error('Carta não contém o nome do candidato');
    }

    // Verifica se a carta contém elementos essenciais
    const hasExperience = coverLetter.includes(String(totalYears)) || coverLetter.includes('experience');
    const hasCompany = coverLetter.includes(job.company);
    const hasPosition = coverLetter.includes(job.title);

    if (!hasExperience || !hasCompany || !hasPosition) {
      throw new Error('Carta não contém informações essenciais (experiência/empresa/cargo)');
    }

    console.log('✅ Carta gerada com sucesso:', coverLetter.substring(0, 50) + '...');
    return coverLetter;

  } catch (error) {
    console.error('❌ Erro ao gerar carta:', error);
    
    // Se for erro de ambiente/configuração, propaga o erro
    if (error instanceof Error && error.message.includes('API_KEY')) {
      throw error;
    }
    
    // Fallback para carta simples em caso de erro
    const fallbackLetter = `
${template.greeting},

${jobLang === 'en' ? 
  `I, ${resume.name}, am excited to apply for the ${job.title} position at ${job.company}. With ${totalYears} years of experience as a ${latestExperience?.title || 'developer'}, I believe I can contribute significantly to your team.` :
jobLang === 'pt' ?
  `Eu, ${resume.name}, venho por meio desta apresentar minha candidatura à vaga de ${job.title} na empresa ${job.company}. Com ${totalYears} anos de experiência como ${latestExperience?.title || 'desenvolvedor'}, acredito que posso contribuir significativamente para a equipe.` :
  `Yo, ${resume.name}, me dirijo a ustedes para presentar mi candidatura al puesto de ${job.title} en ${job.company}. Con ${totalYears} años de experiencia como ${latestExperience?.title || 'desarrollador'}, creo que puedo contribuir significativamente a su equipo.`}

${jobLang === 'en' ?
  `I have solid experience in ${resume.skills.slice(0, 3).join(', ')} and other relevant technologies. ${latestExperience ? `In my most recent role as ${latestExperience.title} at ${latestExperience.company}, ${latestExperience.description || `I worked with ${(latestExperience.technologies || []).join(', ')}`}.` : ''}` :
jobLang === 'pt' ?
  `Possuo sólida experiência em ${resume.skills.slice(0, 3).join(', ')} e outras tecnologias relevantes. ${latestExperience ? `Em minha experiência mais recente como ${latestExperience.title} na ${latestExperience.company}, ${latestExperience.description || `trabalhei com ${(latestExperience.technologies || []).join(', ')}`}.` : ''}` :
  `Tengo sólida experiencia en ${resume.skills.slice(0, 3).join(', ')} y otras tecnologías relevantes. ${latestExperience ? `En mi experiencia más reciente como ${latestExperience.title} en ${latestExperience.company}, ${latestExperience.description || `trabajé con ${(latestExperience.technologies || []).join(', ')}`}.` : ''}`}

${achievements.length > 0 ? (
  jobLang === 'en' ?
    `My key achievements include: ${achievements.map(a => `${a.title} at ${a.company} where ${a.description || `I worked with ${(a.technologies || []).join(', ')}`}`).join('; ')}` :
  jobLang === 'pt' ?
    `Minhas principais realizações incluem: ${achievements.map(a => `${a.title} na ${a.company} onde ${a.description || `trabalhei com ${(a.technologies || []).join(', ')}`}`).join('; ')}` :
    `Mis logros principales incluyen: ${achievements.map(a => `${a.title} en ${a.company} donde ${a.description || `trabajé con ${(a.technologies || []).join(', ')}`}`).join('; ')}`
) : ''}

${template.closing}

${template.regards},
${resume.name}`.trim();

    console.log('⚠️ Usando carta de fallback');
    return fallbackLetter;
  }
}

/**
 * Gera um assunto personalizado para o email
 */
export function generateEmailSubject(resumeData: ResumeData, jobData: Job): string {
  return `Candidatura para ${jobData.title} - ${resumeData.name}`;
}

/**
 * Gera um resumo da candidatura para logging
 */
export function generateApplicationSummary(
  resumeData: ResumeData,
  jobData: Job,
  coverLetter: string
): string {
  return `Candidatura Enviada:\n- Candidato: ${resumeData.name} (${resumeData.email})\n- Vaga: ${jobData.title} na ${jobData.company}\n- Data: ${new Date().toLocaleString('pt-BR')}\n- Tamanho da carta: ${coverLetter.split(/\s+/).length} palavras\n- Habilidades relevantes: ${resumeData.skills.filter(skill => jobData.description.toLowerCase().includes(skill.toLowerCase())).join(', ')}`;
}
