import mammoth from 'mammoth';
import { Buffer } from 'buffer';
import { groqClient } from './groqClient';

// Importar pdf-parse para extração local de texto
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.log('pdf-parse não disponível, usando abordagem alternativa');
}

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
  totalYearsExperience?: number;
  experienceByTechnology?: Record<string, number>;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
  technologies?: string[];
  yearsInRole?: number;
  achievements?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

/**
 * Limpa e formata resposta JSON do LLM
 */
function cleanJsonResponse(content: string): string {
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

/**
 * Extrai texto de um arquivo PDF usando pdf-parse
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  if (!pdfParse) {
    throw new Error('pdf-parse não está disponível');
  }
  
  try {
    console.log('📄 Extraindo texto do PDF localmente...');
    const data = await pdfParse(buffer);
    const text = data.text;
    
    console.log(`📄 Texto extraído: ${text.length} caracteres`);
    console.log('📄 Primeiros 500 caracteres:', text.substring(0, 500));
    
    return text;
  } catch (error) {
    console.error('❌ Erro ao extrair texto do PDF:', error);
    throw new Error('Falha ao extrair texto do PDF');
  }
}

/**
 * Extrai dados de um arquivo PDF usando extração local de texto
 */
export async function parsePDF(buffer: Buffer): Promise<ResumeData> {
  try {
    console.log('📄 Processando arquivo PDF com extração local de texto...');
    
    // ETAPA 1: Extrair texto localmente
    const text = await extractTextFromPDF(buffer);
    
    // ETAPA 2: Enviar texto para LLM para extrair dados estruturados
    console.log('📄 Enviando texto para LLM...');
    return await extractStructuredData(text);
    
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    
    // Fallback: tentar com base64 em chunks pequenos
    console.log('🔄 Tentando fallback com base64...');
    return await fallbackWithBase64(buffer);
  }
}

/**
 * Extrai dados estruturados do texto usando LLM
 */
async function extractStructuredData(text: string): Promise<ResumeData> {
  // Se o texto for muito grande, dividir em chunks
  if (text.length > 8000) {
    console.log('📄 Texto muito grande, processando em chunks...');
    return await processTextInChunks(text);
  }
  
  const prompt = `
Analise este currículo e extraia as seguintes informações em formato JSON.
IMPORTANTE: Use apenas informações reais extraídas do currículo. NÃO use placeholders.

{
  "name": "Nome real extraído do currículo",
  "email": "Email real extraído do currículo",
  "phone": "Telefone real (se encontrado)",
  "location": "Localização real (se encontrada)",
  "summary": "Resumo real do currículo (se encontrado)",
  "skills": ["tecnologias reais", "ferramentas reais", "habilidades reais"],
  "experience": [
    {
      "title": "Cargo real",
      "company": "Empresa real",
      "duration": "Período real (ex: 2020-2023, 2 anos)",
      "description": "Descrição real das responsabilidades",
      "technologies": ["techs reais usadas"],
      "yearsInRole": 2,
      "achievements": ["conquistas reais"]
    }
  ],
  "education": [
    {
      "degree": "Grau acadêmico real",
      "institution": "Instituição real",
      "year": "Ano real de conclusão",
      "description": "Descrição real (se houver)"
    }
  ],
  "languages": ["idiomas reais"],
  "totalYearsExperience": 5,
  "experienceByTechnology": {
    "JavaScript": 3,
    "React": 2,
    "Node.js": 1
  }
}

INSTRUÇÕES CRÍTICAS:
1. Extraia APENAS informações reais do currículo
2. NÃO use placeholders como "habilidade1", "tech1", etc.
3. Se não encontrar uma informação, use null ou array vazio
4. Para skills, inclua tecnologias, ferramentas, metodologias, idiomas reais
5. Para experience, calcule yearsInRole baseado na duração real
6. Para totalYearsExperience, some todos os anos de experiência real
7. Para experienceByTechnology, mapeie tecnologias reais mencionadas nas experiências
8. Retorne APENAS o JSON válido, sem texto adicional

Texto do currículo:
${text}
`;

  const response = await groqClient.chat([
    {
      role: 'system',
      content: 'Você é um assistente especializado em extrair informações estruturadas de currículos. Analise o texto fornecido e retorne APENAS dados reais extraídos do currículo. NUNCA use placeholders ou dados fictícios.'
    },
    {
      role: 'user',
      content: prompt
    }
  ], {
    temperature: 0.1,
    max_tokens: 2000
  });

  console.log('📄 Resposta do LLM:', response.substring(0, 500));
  
  const cleanedResponse = cleanJsonResponse(response);
  const resumeData = JSON.parse(cleanedResponse);
  
  console.log('✅ Dados extraídos do texto:', {
    name: resumeData.name,
    email: resumeData.email,
    totalYearsExperience: resumeData.totalYearsExperience,
    skills: resumeData.skills,
    experienceCount: resumeData.experience?.length || 0
  });
  
  return resumeData;
}

/**
 * Processa texto em chunks se for muito grande
 */
async function processTextInChunks(text: string): Promise<ResumeData> {
  const chunkSize = 6000; // 6KB por chunk
  const chunks = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  
  console.log(`📄 Texto dividido em ${chunks.length} chunks`);
  
  // Processar apenas os primeiros 2 chunks
  const chunksToProcess = chunks.slice(0, 2);
  const allResults = [];
  
  for (let i = 0; i < chunksToProcess.length; i++) {
    console.log(`📄 Processando chunk de texto ${i + 1}/${chunksToProcess.length}...`);
    
    const chunk = chunksToProcess[i];
    const prompt = `Extraia dados REAIS do currículo em JSON. Chunk ${i + 1}/${chunksToProcess.length}.

IMPORTANTE: Extraia APENAS dados reais encontrados no currículo. NÃO use placeholders.

{
  "name": "Nome real extraído do currículo",
  "email": "Email real extraído do currículo",
  "skills": ["tecnologias reais encontradas", "ferramentas reais"],
  "experience": [
    {
      "title": "Cargo real extraído",
      "company": "Empresa real extraída",
      "duration": "Período real (ex: 2020-2023, 2 anos)",
      "description": "Descrição real das responsabilidades"
    }
  ]
}

INSTRUÇÕES:
1. Extraia APENAS dados reais encontrados no currículo
2. NÃO use placeholders como "nome real", "email real", "tech1", etc.
3. Se não encontrar uma informação, use null ou array vazio
4. Retorne APENAS o JSON válido com dados reais

Texto do currículo (chunk ${i + 1}/${chunksToProcess.length}):
${chunk}`;

    try {
      const response = await groqClient.chat([
        {
          role: 'system',
          content: 'Você é um assistente especializado em extrair informações estruturadas de currículos. Analise o texto fornecido e retorne APENAS dados reais extraídos do currículo. NUNCA use placeholders ou dados fictícios.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.1,
        max_tokens: 1000
      });

      const cleanedResponse = cleanJsonResponse(response);
      const chunkData = JSON.parse(cleanedResponse);
      allResults.push(chunkData);
      
      console.log(`✅ Chunk de texto ${i + 1} processado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao processar chunk de texto ${i + 1}:`, error);
    }
  }
  
  // Combinar resultados
  console.log('📄 Combinando resultados...');
  const combinedResume = combineChunkResults(allResults);
  
  console.log('✅ Dados combinados extraídos:', {
    name: combinedResume.name,
    email: combinedResume.email,
    totalYearsExperience: combinedResume.totalYearsExperience,
    skills: combinedResume.skills,
    experienceCount: combinedResume.experience?.length || 0
  });
  
  return combinedResume;
}

/**
 * Fallback usando base64 em chunks pequenos
 */
async function fallbackWithBase64(buffer: Buffer): Promise<ResumeData> {
  console.log('📄 Usando fallback com base64...');
  
  const base64Data = buffer.toString('base64');
  const chunkSize = 4000; // 4KB por chunk - ainda menor
  const chunks = [];
  
  for (let i = 0; i < base64Data.length; i += chunkSize) {
    chunks.push(base64Data.slice(i, i + chunkSize));
  }
  
  console.log(`📄 PDF dividido em ${chunks.length} chunks de 4KB`);
  
  // Processar apenas o primeiro chunk
  const chunk = chunks[0];
  const prompt = `Extraia dados REAIS do currículo em JSON.

IMPORTANTE: Extraia APENAS dados reais encontrados no currículo. NÃO use placeholders.

{
  "name": "Nome real extraído do currículo",
  "email": "Email real extraído do currículo",
  "skills": ["tecnologias reais encontradas", "ferramentas reais"],
  "experience": [
    {
      "title": "Cargo real extraído",
      "company": "Empresa real extraída",
      "duration": "Período real"
    }
  ]
}

INSTRUÇÕES:
1. Extraia APENAS dados reais encontrados no currículo
2. NÃO use placeholders como "nome real", "email real", "tech1", etc.
3. Se não encontrar uma informação, use null ou array vazio
4. Retorne APENAS o JSON válido com dados reais

Dados do PDF (base64):
${chunk}`;

  try {
    const response = await groqClient.chat([
      {
        role: 'system',
        content: 'Você é um assistente especializado em extrair informações estruturadas de currículos. Analise o PDF fornecido e retorne APENAS dados reais extraídos do currículo. NUNCA use placeholders ou dados fictícios.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.1,
      max_tokens: 800
    });

    const cleanedResponse = cleanJsonResponse(response);
    const resumeData = JSON.parse(cleanedResponse);
    
    console.log('✅ Dados extraídos com fallback:', {
      name: resumeData.name,
      email: resumeData.email,
      skills: resumeData.skills,
      experienceCount: resumeData.experience?.length || 0
    });
    
    return resumeData;
  } catch (error) {
    console.error('❌ Fallback também falhou:', error);
    throw new Error('Falha ao processar arquivo PDF');
  }
}

/**
 * Combina os resultados de múltiplos chunks
 */
function combineChunkResults(chunkResults: any[]): ResumeData {
  const combined: ResumeData = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    languages: [],
    totalYearsExperience: 0,
    experienceByTechnology: {}
  };
  
  const skillsSet = new Set<string>();
  const experienceSet = new Set<string>();
  const educationSet = new Set<string>();
  const languagesSet = new Set<string>();
  
  chunkResults.forEach((chunk, index) => {
    // Nome - usar o primeiro não vazio
    if (!combined.name && chunk.name && chunk.name !== 'null' && chunk.name !== '') {
      combined.name = chunk.name;
    }
    
    // Email - usar o primeiro não vazio
    if (!combined.email && chunk.email && chunk.email !== 'null' && chunk.email !== '') {
      combined.email = chunk.email;
    }
    
    // Phone - usar o primeiro não vazio
    if (!combined.phone && chunk.phone && chunk.phone !== 'null' && chunk.phone !== '') {
      combined.phone = chunk.phone;
    }
    
    // Location - usar o primeiro não vazio
    if (!combined.location && chunk.location && chunk.location !== 'null' && chunk.location !== '') {
      combined.location = chunk.location;
    }
    
    // Summary - concatenar todos os summaries
    if (chunk.summary && chunk.summary !== 'null') {
      combined.summary += (combined.summary ? ' ' : '') + chunk.summary;
    }
    
    // Skills - adicionar sem duplicatas
    if (chunk.skills && Array.isArray(chunk.skills)) {
      chunk.skills.forEach((skill: string) => {
        if (skill && skill !== 'null' && skill !== '' && !skillsSet.has(skill)) {
          skillsSet.add(skill);
          combined.skills.push(skill);
        }
      });
    }
    
    // Experience - adicionar sem duplicatas
    if (chunk.experience && Array.isArray(chunk.experience)) {
      chunk.experience.forEach((exp: any) => {
        const expKey = `${exp.title}-${exp.company}`;
        if (exp.title && exp.title !== 'null' && exp.title !== '' && !experienceSet.has(expKey)) {
          experienceSet.add(expKey);
          combined.experience.push(exp);
        }
      });
    }
    
    // Education - adicionar sem duplicatas
    if (chunk.education && Array.isArray(chunk.education)) {
      chunk.education.forEach((edu: any) => {
        const eduKey = `${edu.degree}-${edu.institution}`;
        if (edu.degree && edu.degree !== 'null' && !educationSet.has(eduKey)) {
          educationSet.add(eduKey);
          combined.education.push(edu);
        }
      });
    }
    
    // Languages - adicionar sem duplicatas
    if (chunk.languages && Array.isArray(chunk.languages)) {
      chunk.languages.forEach((lang: string) => {
        if (lang && lang !== 'null' && !languagesSet.has(lang)) {
          languagesSet.add(lang);
          combined.languages!.push(lang);
        }
      });
    }
    
    // Total years experience - somar todos
    if (chunk.totalYearsExperience && chunk.totalYearsExperience > 0) {
      combined.totalYearsExperience += chunk.totalYearsExperience;
    }
    
    // Experience by technology - combinar
    if (chunk.experienceByTechnology) {
      Object.entries(chunk.experienceByTechnology).forEach(([tech, years]) => {
        if (tech && tech !== 'null' && typeof years === 'number' && years > 0) {
          combined.experienceByTechnology![tech] = (combined.experienceByTechnology![tech] || 0) + years;
        }
      });
    }
  });
  
  console.log(`📄 Combinação concluída: ${combined.skills.length} skills, ${combined.experience.length} experiências`);
  
  return combined;
}

/**
 * Extrai dados de um arquivo DOCX
 */
export async function parseDOCX(buffer: Buffer): Promise<ResumeData> {
  try {
    console.log('📄 Processando arquivo DOCX...');
    
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    console.log('📄 Texto extraído do DOCX (primeiros 500 chars):', text.substring(0, 500));
    
    return extractResumeData(text);
  } catch (error) {
    console.error('Erro ao processar DOCX:', error);
    throw new Error('Falha ao processar arquivo DOCX');
  }
}

/**
 * Calcula anos de experiência total
 */
function calculateTotalExperience(experience: Experience[]): number {
  let totalYears = 0;
  experience.forEach(exp => {
    if (exp.yearsInRole) {
      totalYears += exp.yearsInRole;
    } else {
      // Tenta extrair anos da string de duração
      const duration = exp.duration.toLowerCase();
      const years = duration.match(/(\d+)\s*(?:year|ano)/i);
      const months = duration.match(/(\d+)\s*(?:month|mes|mês)/i);
      
      if (years) totalYears += parseInt(years[1]);
      if (months) totalYears += parseInt(months[1]) / 12;
    }
  });
  return Math.round(totalYears * 10) / 10; // Arredonda para 1 casa decimal
}

/**
 * Calcula experiência por tecnologia
 */
function calculateExperienceByTechnology(experience: Experience[]): Record<string, number> {
  const techExperience: Record<string, number> = {};
  
  experience.forEach(exp => {
    const yearsInRole = exp.yearsInRole || 1; // Default 1 ano se não especificado
    
    if (exp.technologies) {
      exp.technologies.forEach(tech => {
        if (techExperience[tech]) {
          techExperience[tech] += yearsInRole;
        } else {
          techExperience[tech] = yearsInRole;
        }
      });
    }
  });
  
  return techExperience;
}

/**
 * Extrai dados estruturados do texto do currículo usando regex e heurísticas
 */
function extractResumeData(text: string): ResumeData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('📄 Processando texto do currículo...');
  console.log('📄 Primeiras 10 linhas:', lines.slice(0, 10));
  
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
  
  // Calcular anos de experiência total
  const totalYearsExperience = calculateTotalExperience(experience);
  
  // Calcular experiência por tecnologia
  const experienceByTechnology = calculateExperienceByTechnology(experience);
  
  const resumeData = {
    name,
    email,
    phone,
    location,
    summary,
    skills,
    experience,
    education,
    languages,
    totalYearsExperience,
    experienceByTechnology
  };
  
  console.log('✅ Dados extraídos do currículo:', {
    name: resumeData.name,
    email: resumeData.email,
    totalYearsExperience: resumeData.totalYearsExperience,
    skills: resumeData.skills,
    experienceCount: resumeData.experience.length,
    experienceByTechnology: resumeData.experienceByTechnology
  });
  
  return resumeData;
}

function extractName(lines: string[]): string {
  console.log('🔍 Procurando nome nas primeiras linhas...');
  
  // Procura por padrões de nome na primeira linha ou linhas iniciais
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    console.log(`📝 Linha ${i}: "${line}"`);
    
    // Padrão mais flexível para nomes brasileiros
    const namePatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+/, // João Silva
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+/, // João Silva Santos
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+/, // João Silva Santos Costa
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = line.match(pattern);
      if (nameMatch && 
          !line.toLowerCase().includes('email') && 
          !line.toLowerCase().includes('phone') && 
          !line.toLowerCase().includes('@') &&
          !line.toLowerCase().includes('curriculum') &&
          !line.toLowerCase().includes('resume') &&
          !line.toLowerCase().includes('cv') &&
          line.length < 50) { // Nomes não são muito longos
        
        console.log('✅ Nome encontrado:', nameMatch[0]);
        return nameMatch[0];
      }
    }
  }
  
  console.log('❌ Nome não encontrado, usando padrão');
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
  const experienceKeywords = ['experience', 'work', 'employment', 'job', 'career', 'professional', 'experiência', 'profissional'];
  
  console.log('🔍 Procurando seções de experiência...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      console.log('🔍 Encontrada seção de experiência na linha:', i, lines[i]);
      
      // Procura por experiências nas próximas linhas
      for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
        const expLine = lines[j];
        
        // Padrões mais flexíveis para experiências brasileiras
        const expPatterns = [
          /(.+?)\s+(?:at|@|in|\||na|em)\s+(.+?)\s*[-|]\s*(.+)/i, // Título na Empresa | Data
          /(.+?)\s*[-|]\s*(.+?)\s*[-|]\s*(.+)/i, // Título - Empresa - Data
          /(.+?)\s+(.+?)\s*[-|]\s*(.+)/i, // Título Empresa | Data
        ];
        
        for (const pattern of expPatterns) {
          const expMatch = expLine.match(pattern);
          if (expMatch) {
            console.log('✅ Experiência encontrada:', expMatch);
            
            const title = expMatch[1].trim();
            const company = expMatch[2].trim();
            const duration = expMatch[3].trim();
            
            // Valida se parece uma experiência real
            if (title.length > 3 && company.length > 3 && duration.length > 3) {
              let description = '';
              let technologies: string[] = [];
              
              // Procura por descrição nas próximas linhas
              for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
                const descLine = lines[k];
                if (descLine.length > 10 && 
                    !descLine.match(/^\d{4}/) && 
                    !descLine.toLowerCase().includes('education') &&
                    !descLine.toLowerCase().includes('habilidades') &&
                    !descLine.toLowerCase().includes('skills') &&
                    !descLine.toLowerCase().includes('idiomas')) {
                  description += descLine + ' ';
                  
                  const techKeywords = [
                    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 
                    'TypeScript', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Angular', 
                    'Vue.js', 'Next.js', 'Express', 'Django', 'Flask', 'Spring', 'PHP',
                    'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Flutter'
                  ];
                  techKeywords.forEach(tech => {
                    if (descLine.toLowerCase().includes(tech.toLowerCase())) {
                      technologies.push(tech);
                    }
                  });
                }
              }
              
              let yearsInRole = 1;
              const yearMatch = duration.match(/(\d{4})/);
              if (yearMatch) {
                const startYear = parseInt(yearMatch[1]);
                const currentYear = new Date().getFullYear();
                yearsInRole = Math.max(1, currentYear - startYear);
              }
              
              experience.push({
                title,
                company,
                duration,
                description: description.trim() || 'Desenvolvimento de aplicações e sistemas',
                technologies: technologies.length > 0 ? technologies : undefined,
                yearsInRole,
                achievements: []
              });
              
              console.log('📊 Experiência processada:', { 
                title, 
                company, 
                duration, 
                yearsInRole, 
                technologies,
                descriptionLength: description.trim().length 
              });
              
              // Pula algumas linhas para não processar a mesma experiência múltiplas vezes
              j += 5;
              break; // Sai do loop de padrões
            }
          }
        }
      }
    }
  }
  
  console.log(`📊 Total de experiências encontradas: ${experience.length}`);
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