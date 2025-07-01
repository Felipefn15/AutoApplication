import mammoth from 'mammoth';
import { Buffer } from 'buffer';

export interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  languages?: string[];
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

/**
 * Extrai dados de um arquivo PDF (versão simplificada)
 */
export async function parsePDF(buffer: Buffer): Promise<ResumeData> {
  try {
    // Por enquanto, retorna dados mock para PDF
    // TODO: Implementar parser PDF mais robusto
    return {
      name: 'Nome do Candidato',
      email: 'candidato@email.com',
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: [
        {
          title: 'Desenvolvedor Full Stack',
          company: 'Empresa Exemplo',
          duration: '2020-2023',
          description: 'Desenvolvimento de aplicações web'
        }
      ],
      education: [
        {
          degree: 'Bacharel em Ciência da Computação',
          institution: 'Universidade Exemplo',
          year: '2020'
        }
      ]
    };
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    throw new Error('Falha ao processar arquivo PDF');
  }
}

/**
 * Extrai dados de um arquivo DOCX
 */
export async function parseDOCX(buffer: Buffer): Promise<ResumeData> {
  try {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    return extractResumeData(text);
  } catch (error) {
    console.error('Erro ao processar DOCX:', error);
    throw new Error('Falha ao processar arquivo DOCX');
  }
}

/**
 * Extrai dados estruturados do texto do currículo usando regex e heurísticas
 */
function extractResumeData(text: string): ResumeData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extrair nome (primeira linha ou linha com formato de nome)
  const name = extractName(lines);
  
  // Extrair email
  const email = extractEmail(text);
  
  // Extrair telefone
  const phone = extractPhone(text);
  
  // Extrair localização
  const location = extractLocation(lines);
  
  // Extrair habilidades
  const skills = extractSkills(text);
  
  // Extrair experiências
  const experience = extractExperience(lines);
  
  // Extrair educação
  const education = extractEducation(lines);
  
  // Extrair resumo
  const summary = extractSummary(lines);
  
  // Extrair idiomas
  const languages = extractLanguages(text);
  
  return {
    name,
    email,
    phone,
    location,
    summary,
    skills,
    experience,
    education,
    languages
  };
}

function extractName(lines: string[]): string {
  // Procura por padrões de nome na primeira linha ou linhas iniciais
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Padrão: duas palavras com primeira letra maiúscula
    const nameMatch = line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/);
    if (nameMatch && !line.toLowerCase().includes('email') && !line.toLowerCase().includes('phone')) {
      return nameMatch[0];
    }
  }
  return 'Nome não encontrado';
}

function extractEmail(text: string): string {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : 'email@example.com';
}

function extractPhone(text: string): string | undefined {
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : undefined;
}

function extractLocation(lines: string[]): string | undefined {
  // Procura por padrões de localização
  for (const line of lines) {
    if (line.match(/[A-Z][a-z]+, [A-Z]{2}/) || line.match(/[A-Z][a-z]+, [A-Z][a-z]+/)) {
      return line;
    }
  }
  return undefined;
}

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  
  // Lista de tecnologias comuns
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Flutter',
    'Angular', 'Vue.js', 'Next.js', 'Express', 'Django', 'Flask', 'Spring',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'GitLab', 'CI/CD',
    'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind CSS', 'Bootstrap',
    'GraphQL', 'REST API', 'Microservices', 'Agile', 'Scrum'
  ];
  
  for (const skill of commonSkills) {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  
  return skills.slice(0, 15); // Limita a 15 habilidades
}

function extractExperience(lines: string[]): Experience[] {
  const experience: Experience[] = [];
  const experienceKeywords = ['experience', 'work', 'employment', 'job', 'career'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      // Procura por padrões de experiência nas próximas linhas
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const expLine = lines[j];
        
        // Padrão: Título na Empresa | Data
        const expMatch = expLine.match(/(.+?)\s+(?:at|@|in)\s+(.+?)\s*[-|]\s*(.+)/i);
        if (expMatch) {
          experience.push({
            title: expMatch[1].trim(),
            company: expMatch[2].trim(),
            duration: expMatch[3].trim(),
            description: 'Descrição da experiência'
          });
        }
      }
    }
  }
  
  return experience.slice(0, 5); // Limita a 5 experiências
}

function extractEducation(lines: string[]): Education[] {
  const education: Education[] = [];
  const educationKeywords = ['education', 'academic', 'degree', 'university', 'college'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      // Procura por padrões de educação nas próximas linhas
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const eduLine = lines[j];
        
        // Padrão: Grau na Instituição | Ano
        const eduMatch = eduLine.match(/(.+?)\s+(?:at|@|in)\s+(.+?)\s*[-|]\s*(\d{4})/i);
        if (eduMatch) {
          education.push({
            degree: eduMatch[1].trim(),
            institution: eduMatch[2].trim(),
            year: eduMatch[3].trim()
          });
        }
      }
    }
  }
  
  return education.slice(0, 3); // Limita a 3 formações
}

function extractSummary(lines: string[]): string | undefined {
  const summaryKeywords = ['summary', 'about', 'profile', 'objective'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Retorna as próximas linhas como resumo
      const summaryLines = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].length > 20) { // Linhas com conteúdo substancial
          summaryLines.push(lines[j]);
        }
      }
      return summaryLines.join(' ').substring(0, 200);
    }
  }
  
  return undefined;
}

function extractLanguages(text: string): string[] {
  const languages: string[] = [];
  const commonLanguages = [
    'Portuguese', 'English', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano'
  ];
  
  for (const language of commonLanguages) {
    if (text.toLowerCase().includes(language.toLowerCase())) {
      languages.push(language);
    }
  }
  
  return languages;
}

/**
 * Função principal para processar qualquer tipo de arquivo de currículo
 */
export async function parseResume(file: File): Promise<ResumeData> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  if (file.type === 'application/pdf') {
    return parsePDF(buffer);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDOCX(buffer);
  } else {
    throw new Error('Formato de arquivo não suportado. Use PDF ou DOCX.');
  }
} 