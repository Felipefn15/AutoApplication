import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages,
      model: options.model || 'llama3-8b-8192',
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

  async generateCoverLetter(
    resumeData: any,
    jobData: any
  ): Promise<string> {
    const prompt = `
Crie uma carta de apresentação profissional para a vaga de ${jobData.title} na empresa ${jobData.company}.

DADOS DO CANDIDATO:
- Habilidades: ${resumeData.skills?.join(', ') || 'não especificadas'}
- Experiências: ${resumeData.experience?.map((exp: any) => `${exp.title} na ${exp.company}`).join('; ') || 'não especificadas'}

DADOS DA VAGA:
- Título: ${jobData.title}
- Empresa: ${jobData.company}
- Descrição: ${jobData.description?.substring(0, 500)}...

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

    return await this.chat([
        {
        role: 'system',
        content: 'Você é um assistente especializado em criar cartas de apresentação profissionais e persuasivas. Sua tarefa é gerar uma carta de apresentação personalizada que conecte as habilidades e experiências do candidato com os requisitos da vaga. A carta deve ser concisa (máximo 200 palavras), profissional e focada em demonstrar valor para a empresa.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.7,
      max_tokens: 500
    });
  }

  async filterRelevantJobs(
    jobs: any[],
    resumeData: any
  ): Promise<number[]> {
    const prompt = `
Analise as seguintes vagas e retorne apenas as que são relevantes para o candidato.
Considere as habilidades, experiências e perfil do candidato.

CANDIDATO:
- Habilidades: ${resumeData.skills?.join(', ') || 'não especificadas'}
- Experiências: ${resumeData.experience?.map((exp: any) => `${exp.title} na ${exp.company}`).join('; ') || 'não especificadas'}

VAGAS DISPONÍVEIS:
${jobs.map((job, index) => `
${index + 1}. ${job.title} na ${job.company}
   Localização: ${job.location}
   Descrição: ${job.description?.substring(0, 200)}...
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

    const response = await this.chat([
      {
        role: 'system',
        content: 'Você é um assistente especializado em matching de vagas. Analise as vagas e retorne apenas os números das vagas relevantes em formato JSON array.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.3,
      max_tokens: 100
    });

    try {
      const cleanedContent = GroqClient.cleanJsonResponse(response);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse job filter response:', error);
      return [];
    }
  }
} 

export const groqClient = new GroqClient();
export { GroqClient }; 