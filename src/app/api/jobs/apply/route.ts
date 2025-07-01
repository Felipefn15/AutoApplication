import { NextRequest, NextResponse } from 'next/server';
import { parseResume, ResumeData } from '@/lib/resumeParser';
import { generateCoverLetter, JobData } from '@/lib/coverLetterGenerator';
import { sendApplicationEmail } from '@/lib/emailSender';

/**
 * POST /api/jobs/apply
 * Aplica automaticamente para vagas selecionadas
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const selectedJobsJson = formData.get('selectedJobs') as string;
    
    if (!resumeFile || !selectedJobsJson) {
      return NextResponse.json(
        { error: 'Arquivo de currículo e vagas selecionadas são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (máximo 5MB)
    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB permitido.' },
        { status: 400 }
      );
    }

    // Parse das vagas selecionadas
    let selectedJobs: JobData[];
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

    // Processar currículo
    const resumeData = await parseResume(resumeFile);
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    
    console.log(`Processando candidatura de ${resumeData.name} (${resumeData.email})`);

    // Aplicar para cada vaga selecionada
    const results = [];
    
    for (const job of selectedJobs) {
      try {
        console.log(`Aplicando para: ${job.title} na ${job.company}`);
        
        // Gerar carta de apresentação personalizada
        const coverLetter = await generateCoverLetter(resumeData, job);
        console.log(`Carta gerada (${coverLetter.split(/\s+/).length} palavras)`);
        
        // Enviar email de candidatura
        const emailResult = await sendApplicationEmail(
          resumeData,
          job,
          coverLetter,
          resumeBuffer,
          resumeFile.name
        );
        
        if (emailResult.success) {
          results.push({
            job: {
              title: job.title,
              company: job.company,
              url: job.url
            },
            status: 'success',
            message: 'Candidatura enviada com sucesso'
          });
          
          console.log(`✅ Candidatura enviada para ${job.company}`);
        } else {
          results.push({
            job: {
              title: job.title,
              company: job.company,
              url: job.url
            },
            status: 'error',
            message: emailResult.error || 'Erro ao enviar candidatura'
          });
          
          console.log(`❌ Erro ao enviar candidatura para ${job.company}: ${emailResult.error}`);
        }
        
        // Aguardar 2 segundos entre aplicações para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Erro ao processar vaga ${job.title}:`, error);
        
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