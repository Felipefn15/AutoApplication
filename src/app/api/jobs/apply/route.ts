import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/resumeParser';
import { generateCoverLetter, generateEmailSubject } from '@/lib/coverLetterGenerator';
import { sendApplicationEmail, extractRecruiterEmail } from '@/lib/emailSender';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function suggestEmailWithLLM(description: string, company: string): Promise<string | null> {
  const prompt = `Com base na descrição da vaga abaixo, qual seria o e-mail de contato para candidatura? Se não houver, tente inferir um padrão (ex: jobs@empresa.com, hr@empresa.com, careers@empresa.com). Retorne apenas o e-mail ou null.\n\nEmpresa: ${company}\nDescrição:\n${description}`;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Você é um assistente que extrai e-mails de contato de descrições de vagas.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.2,
      max_tokens: 40,
    });
    const response = completion.choices[0]?.message?.content?.trim();
    if (!response) return null;
    const match = response.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : null;
  } catch (e) {
    return null;
  }
}

async function validateAndGetEmail(job: any, description: string, company: string): Promise<string | null> {
  console.log('🔍 Iniciando busca por email para', company);
  
  // Primeiro tenta extrair da descrição
  let email = extractRecruiterEmail(description || '');
  console.log('📧 Email extraído da descrição:', email);
  
  // Se não encontrou, tenta via LLM
  if (!email) {
    try {
      console.log('🤖 Tentando sugerir email via LLM...');
      email = await suggestEmailWithLLM(description || '', company || '');
      console.log('🤖 Email sugerido via LLM:', email);
    } catch (e) {
      console.error('❌ Erro ao sugerir email via LLM:', e);
      email = null;
    }
  }

  // Se ainda não encontrou e tem site da empresa, tenta inferir
  if (!email && job.company_url) {
    console.log('🌐 Tentando inferir email do domínio:', job.company_url);
    try {
      const domain = new URL(job.company_url).hostname.replace('www.', '');
      const commonEmails = [
        `jobs@${domain}`,
        `careers@${domain}`,
        `hr@${domain}`,
        `recruiting@${domain}`,
        `talent@${domain}`
      ];
      
      // Usa o primeiro email da lista
      email = commonEmails[0];
      console.log('🌐 Email inferido do domínio:', email);
    } catch (e) {
      console.error('❌ Erro ao inferir email do domínio:', e);
    }
  }

  console.log('📧 Email final encontrado:', email);
  return email;
}

/**
 * POST /api/jobs/apply
 * Aplica automaticamente para vagas selecionadas
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const isPreview = url.searchParams.get('preview') === '1';
  console.log('🚀 Iniciando processo de aplicação - Modo:', isPreview ? 'preview' : 'envio');

  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const selectedJobsJson = formData.get('selectedJobs') as string;
    const resumeDataJson = formData.get('resumeData') as string;
    
    if (!selectedJobsJson) {
      return NextResponse.json(
        { error: 'Vagas selecionadas são obrigatórias' },
        { status: 400 }
      );
    }

    // Parse das vagas selecionadas
    let selectedJobs: any[];
    try {
      selectedJobs = JSON.parse(selectedJobsJson);
  } catch (error) {
      return NextResponse.json(
        { error: 'Formato inválido das vagas selecionadas' },
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedJobs) || selectedJobs.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma vaga selecionada' },
        { status: 400 }
      );
    }

    // Limitar a 5 vagas por vez para evitar spam
    if (selectedJobs.length > 5) {
      return NextResponse.json(
        { error: 'Máximo 5 vagas por aplicação' },
        { status: 400 }
      );
    }

    console.log(`Iniciando aplicação para ${selectedJobs.length} vagas...`);

    // Processar dados do currículo
    let resumeData: ResumeData;
    let resumeBuffer: Buffer | null = null;
    
    if (resumeDataJson) {
      // Usar dados já parseados do frontend
      try {
        resumeData = JSON.parse(resumeDataJson);
        console.log('✅ Usando dados do currículo já parseados para:', resumeData.name);
      } catch (error) {
        return NextResponse.json(
          { error: 'Formato inválido dos dados do currículo' },
          { status: 400 }
        );
      }
    } else if (resumeFile) {
      // Fallback: parsear arquivo se dados não foram fornecidos
      console.log('📄 Processando currículo...');
      const { parseResume } = await import('@/lib/resumeParser');
      resumeData = await parseResume(resumeFile);
      resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
      console.log('✅ Currículo processado para:', resumeData.name);
    } else {
      return NextResponse.json(
        { error: 'Dados do currículo são obrigatórios' },
        { status: 400 }
      );
    }

    // Aplicar para cada vaga selecionada
    const results = [];
    
    for (const job of selectedJobs) {
      console.log('\n🎯 Processando vaga:', job.title, 'na', job.company);
      
      try {
        // Primeiro valida e obtém o email
        const recruiterEmail = await validateAndGetEmail(
          job,
          job.description || '',
          job.company || ''
        );

        if (!recruiterEmail) {
          console.log('❌ Nenhum email válido encontrado para', job.company);
          results.push({
            job: {
              title: job.title,
              company: job.company,
              url: job.url
            },
            status: 'error',
            message: 'Não foi possível encontrar um email válido para envio da candidatura'
          });
          continue;
        }

        // Gera a carta com retry
        console.log('📝 Gerando carta de apresentação...');
        let coverLetter = '';
        let usedFallback = false;
        
        try {
          coverLetter = await generateCoverLetter(resumeData, job);
          console.log('✅ Carta gerada com sucesso -', coverLetter.length, 'caracteres');
        } catch (e) {
          console.error('❌ Erro ao gerar carta:', e);
          usedFallback = true;
          coverLetter = `
Prezado recrutador,

Gostaria de manifestar meu interesse na vaga de ${job.title} na ${job.company}. 

Possuo experiência relevante em ${resumeData.skills.slice(0, 3).join(', ')} e acredito que posso contribuir significativamente para a equipe.

${resumeData.experience[0] ? `Em minha experiência mais recente como ${resumeData.experience[0].title} na ${resumeData.experience[0].company}, trabalhei com ${resumeData.experience[0].technologies?.join(', ') || 'tecnologias relevantes'}.` : ''}

Ficarei feliz em detalhar minhas experiências em uma entrevista.

Atenciosamente,
${resumeData.name}`.trim();
          console.log('⚠️ Usando carta de fallback');
        }

        const subject = generateEmailSubject(resumeData, job);
        console.log('📧 Assunto do email:', subject);
        
        // Preview mode
        if (isPreview) {
          console.log('👀 Gerando preview do email...');
          results.push({
            job: {
              title: job.title,
              company: job.company,
              url: job.url
            },
            status: 'preview',
            email: {
              to: recruiterEmail,
              subject,
              body: coverLetter,
              fallback: usedFallback
            }
          });
          console.log('✅ Preview gerado com sucesso');
          continue;
        }

        // Envio real
        console.log('📨 Enviando email para:', recruiterEmail);
        const emailResult = await sendApplicationEmail(
          resumeData,
          job,
          coverLetter,
          resumeBuffer || Buffer.alloc(0),
          resumeFile?.name || 'resume.pdf'
        );

        if (emailResult.success) {
          console.log('✅ Email enviado com sucesso');
          results.push({
            job: {
              title: job.title,
              company: job.company,
              url: job.url
            },
            status: 'success',
            message: 'Candidatura enviada com sucesso'
          });
        } else {
          console.error('❌ Erro ao enviar email:', emailResult.error);
          results.push({
            job: {
              title: job.title,
              company: job.company,
              url: job.url
            },
            status: 'error',
            message: emailResult.error || 'Erro ao enviar candidatura'
          });
        }

        // Aguarda entre aplicações
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error('❌ Erro ao processar vaga:', error);
        results.push({
          job: {
            title: job.title,
            company: job.company,
            url: job.url
          },
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // Estatísticas da aplicação
    const successfulApplications = results.filter(r => r.status === 'success').length;
    const failedApplications = results.filter(r => r.status === 'error').length;
    
    console.log(`Aplicação concluída: ${successfulApplications} sucessos, ${failedApplications} falhas`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: selectedJobs.length,
        successful: successfulApplications,
        failed: failedApplications,
        candidate: {
          name: resumeData.name,
          email: resumeData.email
        }
      }
    });

  } catch (error) {
    console.error('Erro na aplicação automática:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/apply
 * Retorna informações sobre o status do serviço de email
 */
export async function GET() {
  try {
    const { validateEmailConfig } = await import('@/lib/emailSender');
    const emailConfig = validateEmailConfig();
    
    return NextResponse.json({
      service: 'AutoApplication API',
      status: 'online',
      email: {
        configured: emailConfig.valid,
        errors: emailConfig.errors
      },
      limits: {
        maxResumeSize: '5MB',
        maxJobsPerApplication: 5,
        supportedFormats: ['PDF', 'DOCX']
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status do serviço:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar status do serviço' },
      { status: 500 }
    );
  }
} 