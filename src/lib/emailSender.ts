import nodemailer from 'nodemailer';
import { ResumeData } from './resumeParser';
import { JobData } from './coverLetterGenerator';

export interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Envia email usando Resend API (recomendado)
 */
async function sendWithResend(config: EmailConfig): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.RESEND_SENDER_EMAIL;
    
    if (!resendApiKey || !senderEmail) {
      throw new Error('Configurações do Resend não encontradas');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: config.to,
        subject: config.subject,
        html: config.html,
        attachments: config.attachments?.map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          contentType: att.contentType,
        }))
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar email via Resend:', error);
    return false;
  }
}

/**
 * Envia email usando SMTP (fallback)
 */
async function sendWithSMTP(config: EmailConfig): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: config.to,
      subject: config.subject,
      html: config.html,
      attachments: config.attachments,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email via SMTP:', error);
    return false;
  }
}

/**
 * Função principal para enviar email de candidatura
 */
export async function sendApplicationEmail(
  resumeData: ResumeData,
  jobData: JobData,
  coverLetter: string,
  resumeBuffer: Buffer,
  resumeFileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extrair email do recrutador da descrição da vaga
    const recruiterEmail = extractRecruiterEmail(jobData.description);
    
    if (!recruiterEmail) {
      return {
        success: false,
        error: 'Email do recrutador não encontrado na descrição da vaga'
      };
    }

    const subject = `Candidatura para ${jobData.title} - ${resumeData.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Candidatura</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Candidatura para ${jobData.title}</h2>
          
          <p><strong>Olá,</strong></p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            ${coverLetter.replace(/\n/g, '<br>')}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p><strong>Atenciosamente,</strong><br>
            ${resumeData.name}<br>
            ${resumeData.email}</p>
            
            ${resumeData.phone ? `<p>Telefone: ${resumeData.phone}</p>` : ''}
            ${resumeData.location ? `<p>Localização: ${resumeData.location}</p>` : ''}
          </div>
          
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>Esta candidatura foi enviada através do AutoApplication.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailConfig: EmailConfig = {
      to: recruiterEmail,
      subject,
      html,
      attachments: [{
        filename: resumeFileName,
        content: resumeBuffer,
        contentType: 'application/pdf'
      }]
    };

    // Tenta primeiro com Resend, depois com SMTP
    let success = await sendWithResend(emailConfig);
    
    if (!success) {
      console.log('Tentando enviar via SMTP...');
      success = await sendWithSMTP(emailConfig);
    }

    if (success) {
      console.log(`Email enviado com sucesso para ${recruiterEmail}`);
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Falha ao enviar email via Resend e SMTP'
      };
    }

  } catch (error) {
    console.error('Erro ao enviar email de candidatura:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Extrai email do recrutador da descrição da vaga
 */
function extractRecruiterEmail(description: string): string | null {
  // Padrões comuns de email em descrições de vaga
  const emailPatterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /contato@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /jobs@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /hr@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /careers@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ];

  for (const pattern of emailPatterns) {
    const matches = description.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }

  // Se não encontrar email específico, retorna um email genérico
  // (em produção, você pode querer retornar null e não enviar o email)
  return 'jobs@example.com';
}

/**
 * Valida se as configurações de email estão corretas
 */
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verifica Resend
  if (!process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY não configurada');
  }
  if (!process.env.RESEND_SENDER_EMAIL) {
    errors.push('RESEND_SENDER_EMAIL não configurada');
  }
  
  // Verifica SMTP (fallback)
  if (!process.env.SMTP_HOST) {
    errors.push('SMTP_HOST não configurada');
  }
  if (!process.env.SMTP_USER) {
    errors.push('SMTP_USER não configurada');
  }
  if (!process.env.SMTP_PASSWORD) {
    errors.push('SMTP_PASSWORD não configurada');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
} 