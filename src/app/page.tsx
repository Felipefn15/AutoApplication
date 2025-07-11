'use client';

import { useState } from 'react';

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

export interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    description?: string;
  }>;
  languages?: string[];
}

export interface ApplicationResult {
  job: {
    title: string;
    company: string;
    url: string;
  };
  status: 'success' | 'error';
  message: string;
  emailDetails?: {
    to: string;
    subject: string;
    body: string;
  };
}

// Componente ResumeUpload
function ResumeUpload({ onUpload, isLoading }: { onUpload: (file: File) => void; isLoading: boolean }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo PDF ou DOCX');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter menos de 5MB');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Upload do Currículo
        </h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-medium">
                Clique para selecionar
              </span>
              <span className="text-gray-500"> ou arraste e solte</span>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
            />
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            PDF ou DOCX, máximo 5MB
          </p>
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800">{selectedFile.name}</span>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              'Buscar Vagas'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para renderizar a descrição da vaga
function JobDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Função para limpar e formatar o HTML
  const sanitizeAndFormatDescription = (desc: string) => {
    // Remove tags HTML específicas mantendo algumas formatações
    const cleanDesc = desc
      .replace(/<\/?(?:div|span)[^>]*>/g, '') // Remove div e span
      .replace(/<\/p>/g, '\n') // Substitui </p> por quebra de linha
      .replace(/<p[^>]*>/g, '') // Remove <p> mantendo o conteúdo
      .replace(/<br\s*\/?>/g, '\n') // Substitui <br> por quebra de linha
      .replace(/<li[^>]*>/g, '• ') // Substitui <li> por bullet point
      .replace(/<\/?(?:ul|ol|li)[^>]*>/g, '\n') // Remove outras tags de lista
      .replace(/<[^>]+>/g, '') // Remove outras tags HTML
      .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaço
      .replace(/&amp;/g, '&') // Corrige &amp;
      .replace(/&lt;/g, '<') // Corrige &lt;
      .replace(/&gt;/g, '>') // Corrige &gt;
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove múltiplas quebras de linha
      .replace(/^\s+|\s+$/g, '') // Remove espaços em branco no início e fim
      .trim();

    return cleanDesc;
  };

  // Verifica se o conteúdo parece ser HTML
  const isHTML = /<[a-z][\s\S]*>/i.test(description);
  const cleanContent = isHTML ? sanitizeAndFormatDescription(description) : description;
  
  // Divide o conteúdo em parágrafos
  const paragraphs = cleanContent
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return (
    <div className="relative">
      <div
        className={`prose prose-sm max-w-none text-gray-600 overflow-hidden ${
          !isExpanded ? 'max-h-[300px]' : ''
        }`}
      >
        {paragraphs.map((paragraph, index) => (
          <p 
            key={index} 
            className={`mb-2 last:mb-0 ${paragraph.startsWith('•') ? 'pl-4' : ''}`}
          >
            {paragraph}
          </p>
        ))}
      </div>
      
      {!isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      )}
    </div>
  );
}

// Componente JobsList
function JobsList({ 
  jobs, 
  selectedJobs, 
  onJobSelection, 
  onApply, 
  isApplying,
  onShowJobModal,
  resumeKeywords
}: { 
  jobs: JobData[]; 
  selectedJobs: JobData[]; 
  onJobSelection: (job: JobData, selected: boolean) => void; 
  onApply: () => void; 
  isApplying: boolean; 
  onShowJobModal: (job: JobData) => void;
  resumeKeywords: {
    skills: string[];
    location?: string;
    experience: string[];
    education: string[];
    languages: string[];
  };
}) {
  const [jobModal, setJobModal] = useState<JobData | null>(null);
  
  const handleSelectAll = (checked: boolean) => {
    jobs.forEach(job => onJobSelection(job, checked));
  };

  // Função para verificar se uma palavra-chave está no currículo
  const isKeywordInResume = (keyword: string): boolean => {
    const allKeywords = [
      ...(resumeKeywords.skills || []),
      ...(resumeKeywords.experience || []),
      ...(resumeKeywords.education || []),
      ...(resumeKeywords.languages || [])
    ].filter(k => typeof k === 'string').map(k => k.toLowerCase());

    return allKeywords.includes(keyword.toLowerCase());
  };

  // Função para extrair e classificar palavras-chave da vaga
  const extractJobKeywords = (job: JobData) => {
    const keywords = new Set<string>();
    
    // Adiciona skills explícitas
    job.skills.forEach(skill => keywords.add(skill));
    
    // Extrai palavras-chave do título
    job.title.split(/\s+/).forEach(word => {
      if (isKeywordInResume(word)) {
        keywords.add(word);
      }
    });

    // Extrai tecnologias comuns da descrição
    const techPattern = /(React|Node\.js|JavaScript|TypeScript|Python|Java|AWS|Docker|SQL|MongoDB|Express|Vue|Angular|PHP|Ruby|Go|Rust|C#|\.NET|Swift|Kotlin|Flutter|React Native|iOS|Android)/gi;
    const techMatches = job.description.match(techPattern) || [];
    techMatches.forEach(tech => keywords.add(tech));

    return Array.from(keywords);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Vagas Encontradas ({jobs.length})
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedJobs.length === jobs.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="text-sm text-gray-600">Selecionar todas</label>
          </div>
        </div>
        {selectedJobs.length > 0 && (
          <button
            onClick={onApply}
            disabled={isApplying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Aplicando...
              </>
            ) : (
              `Aplicar para ${selectedJobs.length} vaga${selectedJobs.length > 1 ? 's' : ''}`
            )}
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {jobs.map((job) => {
          const isSelected = selectedJobs.some(j => j.url === job.url);
          const jobKeywords = extractJobKeywords(job);
          const matchingKeywords = jobKeywords.filter(keyword => isKeywordInResume(keyword));
          const otherKeywords = jobKeywords.filter(keyword => !isKeywordInResume(keyword));
          
          return (
            <div key={job.url} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onJobSelection(job, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{job.company}</span>
                      <span>•</span>
                      <span>{job.location || 'Remoto'}</span>
                      <span>•</span>
                      <span>{job.source}</span>
                      <span>•</span>
                      <span>{job.posted_at}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <JobDescription description={job.description} />
                </div>

                <div className="space-y-2">
                  {matchingKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Palavras-chave correspondentes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchingKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {otherKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Outras palavras-chave:</h4>
                      <div className="flex flex-wrap gap-2">
                        {otherKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onShowJobModal(job)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver detalhes completos →
                  </button>
                  
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Aplicar no site
                    <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
          </div>
        </div>
  );
}

// Componente ApplicationResults
function ApplicationResults({ 
  results, 
  onReset 
}: { 
  results: ApplicationResult[]; 
  onReset: () => void; 
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Resultado das Aplicações
        </h2>
        <button
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Voltar para Busca
        </button>
      </div>

      <div className="grid gap-6">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`bg-white rounded-lg shadow border p-6 ${
              result.status === 'success' 
                ? 'border-green-200' 
                : 'border-red-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {result.job.title}
                </h3>
                <p className="text-gray-600">{result.job.company}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.status === 'success' ? 'Enviado' : 'Erro'}
              </div>
            </div>

            {result.emailDetails && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destinatário</label>
                  <p className="mt-1 text-sm text-gray-900">{result.emailDetails.to}</p>
                </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Assunto</label>
                  <p className="mt-1 text-sm text-gray-900">{result.emailDetails.subject}</p>
                    </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Corpo do Email</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                    <pre className="whitespace-pre-wrap font-sans">{result.emailDetails.body}</pre>
                  </div>
                </div>
              </div>
            )}

            {result.status === 'error' && (
              <div className="mt-4 text-sm text-red-600">
                <p>Erro: {result.message}</p>
                </div>
              )}

            <div className="mt-4">
              <a
                href={result.job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver vaga original →
              </a>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobDetailsModal({ job, open, onClose }: { job: JobData | null; open: boolean; onClose: () => void }) {
  if (!open || !job) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 relative max-h-[80vh] overflow-y-auto border border-gray-300">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl">×</button>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">{job.title}</h2>
        <div className="text-gray-800 font-medium mb-1">{job.company}</div>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <span>{job.location || 'Remota'}</span>
          <span>•</span>
          <span>{job.source}</span>
          <span>•</span>
          <span>{new Date(job.posted_at).toLocaleDateString('pt-BR')}</span>
        </div>
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {job.skills.slice(0, 10).map((skill, idx) => (
              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{skill}</span>
            ))}
          </div>
        )}
        <div className="prose max-w-none mb-4 text-gray-800" dangerouslySetInnerHTML={{ __html: job.description }} />
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 text-sm font-medium">Ver vaga original ↗</a>
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<JobData[]>([]);
  const [applicationResults, setApplicationResults] = useState<ApplicationResult[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobData | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [roles, setRoles] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [pendingEmails, setPendingEmails] = useState<any[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [step, setStep] = useState<'upload' | 'select' | 'review' | 'sent'>('upload');

  const handleResumeUpload = async (file: File) => {
    setIsLoading(true);
    try {
      setResumeFile(file);
      const formData = new FormData();
      formData.append('resume', file);
      const response = await fetch('/api/jobs/scrape', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Falha ao processar o currículo');
      const data = await response.json();
      setJobs(data.jobs);
      setResumeData(data.resumeData || null);
      setKeywords(data.keywords || []);
      setRoles(data.roles || []);
      setLocation(data.location || '');
      setStep('select');
    } catch (error) {
      alert('Erro ao processar o currículo. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSelection = (job: JobData, selected: boolean) => {
    if (selected) {
      setSelectedJobs(prev => [...prev, job]);
    } else {
      setSelectedJobs(prev => prev.filter(j => j.url !== job.url));
    }
  };

  const handleShowJobModal = (job: JobData) => {
    setSelectedJobForModal(job);
    setShowJobModal(true);
  };

  const handleGenerateEmails = async () => {
    setIsApplying(true);
    try {
      const emails: any[] = [];
      for (const job of selectedJobs) {
        try {
          const formData = new FormData();
          // Enviar todas as vagas selecionadas de uma vez
          formData.append('selectedJobs', JSON.stringify([job]));
          if (resumeData) {
            formData.append('resumeData', JSON.stringify(resumeData));
          } else if (resumeFile) {
            formData.append('resume', resumeFile);
          }
          
          console.log('Enviando dados para preview:', {
            job: job.title,
            company: job.company
          });
          
          const response = await fetch('/api/jobs/apply?preview=1', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Resultado do preview:', result);
          
          if (result.results && result.results.length > 0) {
            const emailResult = result.results[0];
            emails.push({
              job,
              email: emailResult.email,
              status: emailResult.status,
              error: emailResult.status === 'error' ? emailResult.message : null
            });
          } else {
            throw new Error('Resposta vazia do servidor');
          }
        } catch (error) {
          console.error('Erro ao gerar email para', job.title, ':', error);
          emails.push({
            job,
            email: null,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro ao gerar e-mail'
          });
        }
      }
      setPendingEmails(emails);
      setStep('review');
    } catch (error) {
      console.error('Erro geral:', error);
      alert('Erro ao gerar os e-mails. Por favor, tente novamente.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleApproveAndSend = async (idx: number) => {
    const emailObj = pendingEmails[idx];
    if (!emailObj || !emailObj.email) return;
    
    try {
      const formData = new FormData();
      formData.append('selectedJobs', JSON.stringify([emailObj.job]));
      if (resumeData) {
        formData.append('resumeData', JSON.stringify(resumeData));
      } else if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      
      console.log('Enviando candidatura para:', emailObj.job.title);
      
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Resultado do envio:', result);
      
      setPendingEmails(prev => {
        const updated = prev.map((e, i) => {
          if (i === idx) {
            if (result.results && result.results.length > 0) {
              const sendResult = result.results[0];
              return {
                ...e,
                status: sendResult.status,
                error: sendResult.status === 'error' ? sendResult.message : null
              };
            }
            return {
              ...e,
              status: 'error',
              error: 'Resposta inválida do servidor'
            };
          }
          return e;
        });
        
        // Se todos enviados, avance para etapa final
        if (updated.every(e => e.status === 'success' || e.status === 'error')) {
          setStep('sent');
        }
        return updated;
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setPendingEmails(prev => prev.map((e, i) => i === idx ? {
        ...e,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro ao enviar'
      } : e));
    }
  };

  const handleApproveAndSendAll = async () => {
    try {
      console.log('Iniciando envio em massa...');
      for (let i = 0; i < pendingEmails.length; i++) {
        if (pendingEmails[i].status === 'pending') {
          console.log(`Processando email ${i + 1} de ${pendingEmails.length}`);
          await handleApproveAndSend(i);
          // Pequena pausa entre envios para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      console.log('Envio em massa concluído');
      setStep('sent');
    } catch (error) {
      console.error('Erro no envio em massa:', error);
      alert('Erro ao enviar alguns emails. Por favor, verifique os resultados.');
    }
  };

  const handleApplyToJobs = async () => {
    setIsApplying(true);
    try {
      console.log('Iniciando aplicação em massa...');
      const formData = new FormData();
      formData.append('selectedJobs', JSON.stringify(selectedJobs));
      if (resumeData) {
        formData.append('resumeData', JSON.stringify(resumeData));
      } else if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      console.log(`Enviando ${selectedJobs.length} candidaturas...`);
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resultado das aplicações:', result);

      if (result.results) {
        setApplicationResults(result.results);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro na aplicação em massa:', error);
      alert('Erro ao aplicar para as vagas. Por favor, tente novamente.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setJobs([]);
    setSelectedJobs([]);
    setApplicationResults([]);
  };

  // Adicione um indicador visual de progresso no topo do JSX
  const steps = [
    { key: 'upload', label: 'Upload' },
    { key: 'select', label: 'Seleção de vagas' },
    { key: 'review', label: 'Aprovação de emails' },
    { key: 'sent', label: 'Envio' }
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Indicador de progresso */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {steps.map((s, idx) => (
            <div key={s.key} className="flex items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${step === s.key ? 'bg-blue-600' : idx < steps.findIndex(st => st.key === step) ? 'bg-green-500' : 'bg-gray-300'}`}>{idx + 1}</div>
              <span className={`ml-2 font-medium ${step === s.key ? 'text-blue-700' : 'text-gray-600'}`}>{s.label}</span>
              {idx < steps.length - 1 && <span className="mx-3 text-gray-400">→</span>}
            </div>
          ))}
        </div>

        {/* Etapas do fluxo */}
        {step === 'upload' && (
          <ResumeUpload onUpload={handleResumeUpload} isLoading={isLoading} />
        )}
        {step === 'select' && (
          <div className="flex gap-6">
            {/* Sidebar com keywords do currículo */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Palavras-chave do Currículo
                </h3>
                
                <div className="space-y-4">
                  {/* Sugestões LLM */}
                  {keywords.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sugestões LLM (Tecnologias/Skills)</h4>
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((kw, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cargos/Roles LLM */}
                  {roles.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Cargos/Perfis LLM</h4>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">{role}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habilidades */}
                  {resumeData?.skills?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Habilidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experiência */}
                  {resumeData?.experience?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Experiência</h4>
                      <div className="space-y-2">
                        {resumeData.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="text-xs bg-gray-50 rounded p-2">
                            <div className="font-semibold text-gray-800">{exp.title} <span className="font-normal text-gray-600">em</span> {exp.company}</div>
                            {exp.technologies && exp.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {exp.technologies.map((tech: string, i: number) => (
                                  <span key={i} className="inline-block bg-green-100 text-green-800 rounded px-2 py-0.5 text-xxs">{tech}</span>
                                ))}
                              </div>
                            )}
                            <div className="text-gray-500">{exp.duration}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educação */}
                  {resumeData?.education?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Educação</h4>
                      <div className="space-y-2">
                        {resumeData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="text-xs bg-purple-50 rounded p-2">
                            <div className="font-semibold text-purple-800">{edu.degree}</div>
                            <div className="text-gray-700">{edu.institution}</div>
                            <div className="text-gray-500">{edu.year}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Idiomas */}
                  {resumeData?.languages?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Idiomas</h4>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.languages.map((lang: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Localização */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Localização</h4>
                    <span className="text-sm text-gray-600">{location || resumeData?.location || "Não especificada"}</span>
                  </div>

                  {/* Resumo */}
                  {resumeData?.summary && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo</h4>
                      <div className="text-xs text-gray-700 bg-gray-50 rounded p-2">{resumeData.summary}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de vagas */}
            <div className="flex-1">
              <JobsList
                jobs={jobs}
                selectedJobs={selectedJobs}
                onJobSelection={handleJobSelection}
                onApply={handleGenerateEmails}
                isApplying={isApplying}
                onShowJobModal={handleShowJobModal}
                resumeKeywords={resumeData || {
                  skills: [],
                  experience: [],
                  education: [],
                  languages: []
                }}
              />
            </div>
          </div>
        )}
        {step === 'review' && (
          <div className="max-w-3xl mx-auto my-8">
            <h2 className="text-2xl font-bold mb-4">Revisar e-mails antes de enviar</h2>
            <button
              onClick={handleApproveAndSendAll}
              className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
              disabled={pendingEmails.every(e => e.status !== 'pending' || !e.email || !e.email.to || e.error)}
            >
              Aprovar e Enviar Todos
            </button>
            <div className="space-y-6">
              {pendingEmails.map((item, idx) => (
                <div key={idx} className="border rounded p-4 bg-white shadow">
                  <div className="mb-2 text-gray-900 font-semibold">
                    Vaga: {item.job.title} <span className="text-gray-500 font-normal">@ {item.job.company}</span>
                  </div>
                  {item.email && item.email.to ? (
                    <>
                      <div><span className="font-semibold">Para:</span> <span className="text-gray-800">{item.email.to}</span></div>
                      <div><span className="font-semibold">Assunto:</span> <span className="text-gray-800">{item.email.subject}</span></div>
                      <div className="mt-2"><span className="font-semibold">Corpo:</span>
                        <pre className="bg-gray-50 p-2 rounded whitespace-pre-wrap text-xs text-gray-700">{item.email.body}</pre>
                      </div>
                      <div className="mt-2">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleApproveAndSend(idx)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                          >
                            Aprovar e Enviar
                          </button>
                        )}
                        {item.status === 'success' && <span className="text-green-700 font-semibold">Enviado!</span>}
                        {item.status === 'error' && <span className="text-red-700 font-semibold">Erro: {item.error}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="text-red-700 font-semibold">
                      {item.error === 'Email do recrutador não encontrado na descrição da vaga'
                        ? 'Vaga não possui e-mail de recrutador disponível. Aplique manualmente pelo site.'
                        : item.error || 'Erro ao gerar e-mail'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 'sent' && (
          <div className="max-w-2xl mx-auto my-12 text-center">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Todos os e-mails foram enviados!</h2>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Nova busca</button>
          </div>
        )}
      </div>

      <JobDetailsModal
        job={selectedJobForModal}
        open={showJobModal}
        onClose={() => setShowJobModal(false)}
      />
    </main>
  );
}
