# AutoApplication

Aplicação automática para vagas remotas com IA - **Versão Anônima e Gratuita**

## 🚀 Sobre

O AutoApplication é uma ferramenta que automatiza o processo de busca e aplicação para vagas remotas. A versão atual é **totalmente anônima e gratuita**, sem necessidade de cadastro ou banco de dados.

### ✨ Funcionalidades

- **Upload de currículo** (PDF/DOCX) com extração automática de dados
- **Busca inteligente** de vagas remotas usando scraping + IA (Groq)
- **Filtragem personalizada** baseada no perfil do candidato
- **Geração automática** de cartas de apresentação personalizadas
- **Aplicação automática** via email com currículo anexado
- **Interface moderna** e responsiva

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **IA**: Groq API (Llama3-8b-8192)
- **Email**: Resend API ou SMTP (Gmail, Brevo)
- **Scraping**: Cheerio, Playwright headless
- **Parsing**: pdf-parse, mammoth (PDF/DOCX)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm

### 1. Clone o repositório

   ```bash
git clone <repository-url>
cd AutoApplication
   ```

### 2. Instale as dependências

   ```bash
   pnpm install
   ```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

   ```bash
   cp src/env.example .env.local
   ```

Configure as variáveis necessárias:

```env
# === Groq API Configuration ===
GROQ_API_KEY=your_groq_api_key_here

# === Email Configuration (for auto-apply) ===
# Opção 1: Resend (https://resend.com/)
RESEND_API_KEY=your_resend_api_key_here
RESEND_SENDER_EMAIL=your_verified_sender@example.com

# OU

# Opção 2: SMTP (Gmail, Brevo etc)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_app_password_here

# === Scraping Configuration ===
SCRAPING_INTERVAL_MINUTES=60
MAX_JOBS_PER_SCRAPE=100
```

### 4. Execute o projeto

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build
pnpm start
```

## 🔧 Configuração dos Serviços

### Groq API
1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta e obtenha sua API key
3. Adicione a key no `.env.local`

### Email (Resend - Recomendado)
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu domínio de email
4. Obtenha a API key e adicione no `.env.local`

### Email (SMTP - Alternativa)
Para Gmail:
1. Ative a verificação em 2 etapas
2. Gere uma senha de app
3. Use `smtp.gmail.com:587` como configuração

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── jobs/
│   │   │   ├── scrape/route.ts    # Busca de vagas
│   │   │   └── apply/route.ts     # Aplicação automática
│   │   └── ...
│   ├── page.tsx                   # Página principal
│   └── layout.tsx
├── lib/
│   ├── resumeParser.ts            # Parser de currículos
│   ├── coverLetterGenerator.ts    # Gerador de cartas
│   ├── emailSender.ts             # Envio de emails
│   └── scraper.ts                 # Scraping de vagas
└── components/
    └── ...
```

## 🚀 Deploy na Vercel

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente na Vercel
3. Deploy automático a cada push

### Variáveis de ambiente na Vercel

Adicione todas as variáveis do `.env.local` no painel da Vercel:
- `GROQ_API_KEY`
- `RESEND_API_KEY` (ou configurações SMTP)
- `RESEND_SENDER_EMAIL`

## 📋 Como Usar

### 1. Upload do Currículo
- Acesse a aplicação
- Faça upload do seu currículo (PDF ou DOCX)
- O sistema extrai automaticamente seus dados

### 2. Busca de Vagas
- O sistema busca vagas remotas automaticamente
- Filtra as mais relevantes baseado no seu perfil
- Exibe até 10 vagas personalizadas

### 3. Seleção e Aplicação
- Selecione as vagas de interesse (máximo 5)
- Clique em "Aplicar Automaticamente"
- O sistema gera cartas personalizadas e envia emails

## 🔒 Privacidade e Segurança

- **Nenhum dado é persistido** - tudo funciona em memória durante a sessão
- **Sem cadastro obrigatório** - totalmente anônimo
- **Sem banco de dados** - não armazenamos informações pessoais
- **Limite de aplicações** - máximo 5 vagas por sessão para evitar spam

## 📊 Limites e Restrições

- **Tamanho do currículo**: Máximo 5MB
- **Formatos suportados**: PDF, DOCX
- **Vagas por aplicação**: Máximo 5
- **Intervalo entre aplicações**: 2 segundos
- **Tamanho da carta**: Máximo 200 palavras

## 🐛 Troubleshooting

### Erro ao processar currículo
- Verifique se o arquivo é PDF ou DOCX
- Confirme se o tamanho é menor que 5MB
- Teste com um currículo mais simples

### Erro ao enviar emails
- Verifique as configurações do Resend/SMTP
- Confirme se o email remetente está verificado
- Teste com configurações SMTP alternativas

### Vagas não encontradas
- O scraping pode estar temporariamente indisponível
- Tente novamente em alguns minutos
- Verifique se os sites de vagas estão acessíveis

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Verifique a documentação dos serviços utilizados
- Consulte os logs da aplicação

---

**Nota**: Esta é uma versão anônima e gratuita. Para funcionalidades avançadas como histórico de aplicações, perfil persistente e mais vagas, considere a versão completa com autenticação.
