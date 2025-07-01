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

// Componente JobsList
function JobsList({ 
  jobs, 
  selectedJobs, 
  onJobSelection, 
  onApply, 
  isApplying 
}: { 
  jobs: JobData[]; 
  selectedJobs: JobData[]; 
  onJobSelection: (job: JobData, selected: boolean) => void; 
  onApply: () => void; 
  isApplying: boolean; 
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Vagas Encontradas ({jobs.length})
        </h2>
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
        {jobs.map((job, index) => {
          const isSelected = selectedJobs.some(j => j.url === job.url);
          
          return (
            <div key={job.url} className="bg-white rounded-lg shadow border border-gray-200 p-6">
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
                  
                  <p className="text-gray-600 font-medium mb-2">{job.company}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>{job.location || 'Remota'}</span>
                    <span>•</span>
                    <span>{job.source}</span>
                    <span>•</span>
                    <span>{new Date(job.posted_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3">
                    {job.description.substring(0, 200)}...
                  </p>
                  
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.skills.slice(0, 5).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    Ver vaga completa →
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
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Resultado das Candidaturas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{successful}</div>
            <div className="text-sm text-green-800">Sucessos</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <div className="text-sm text-red-800">Falhas</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{results.length}</div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{result.job.title}</h4>
                  <p className="text-sm text-gray-600">{result.job.company}</p>
                  <p className={`text-sm ${
                    result.status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                </div>
                <div className="flex items-center">
                  {result.status === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onReset}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nova Busca
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationResults, setApplicationResults] = useState<ApplicationResult[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'jobs' | 'results'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [searchStrategy, setSearchStrategy] = useState('remote');
  const [coverLetterPreview, setCoverLetterPreview] = useState('');

  const handleResumeUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/jobs/scrape', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar currículo');
      }

      setResumeFile(file);
      setResumeData(data.resumeData);
      setJobs(data.jobs);
      setCurrentStep('jobs');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
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

  const handleApplyToJobs = async () => {
    if (selectedJobs.length === 0) {
      setError('Selecione pelo menos uma vaga para aplicar');
      return;
    }

    if (!resumeFile) {
      setError('Arquivo de currículo não encontrado');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('selectedJobs', JSON.stringify(selectedJobs));

      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aplicar para vagas');
      }

      setApplicationResults(data.results);
      setCurrentStep('results');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setResumeFile(null);
    setResumeData(null);
    setJobs([]);
    setSelectedJobs([]);
    setApplicationResults([]);
    setCurrentStep('upload');
    setError(null);
  };

  // Filtrar vagas por palavra-chave
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(filter.toLowerCase()) ||
    job.company.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Upload Unificado sempre visível se não houver vagas */}
        {!jobs.length ? (
          <div className="md:col-span-2 bg-white rounded-lg shadow p-8 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Agente Automático de Candidatura</h1>
            <ResumeUpload onUpload={handleResumeUpload} isLoading={isLoading} />
          </div>
        ) : (
          <>
            {/* Card Job Openings */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Vagas Encontradas</h2>
                <input
                  type="text"
                  placeholder="Filtrar por palavra-chave"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                />
              </div>
              <JobsList
                jobs={filteredJobs}
                selectedJobs={selectedJobs}
                onJobSelection={handleJobSelection}
                onApply={handleApplyToJobs}
                isApplying={isApplying}
              />
            </div>

            {/* Card Auto Apply by Email */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto Aplicação por E-mail</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Para:</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="recrutador@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assunto:</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Candidatura para vaga de Desenvolvedor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Anexos:</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                      {resumeFile ? resumeFile.name : 'curriculo.pdf'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estratégia de Busca</label>
                  <div className="flex flex-col space-y-1">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        checked={searchStrategy === 'remote'}
                        onChange={() => setSearchStrategy('remote')}
                      />
                      <span className="ml-2 text-sm">Apenas vagas 100% remotas</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        checked={searchStrategy === 'hybrid'}
                        onChange={() => setSearchStrategy('hybrid')}
                      />
                      <span className="ml-2 text-sm">Incluir híbridas (remoto + presencial)</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        checked={searchStrategy === 'onsite'}
                        onChange={() => setSearchStrategy('onsite')}
                      />
                      <span className="ml-2 text-sm">Incluir apenas presenciais</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pré-visualização</label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    rows={6}
                    value={coverLetterPreview}
                    readOnly
                  />
                </div>
                <button
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow disabled:opacity-50"
                  disabled={!emailTo || !emailSubject || !resumeFile}
                >
                  Enviar E-mail
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Resultados da aplicação, se houver */}
      {currentStep === 'results' && (
        <div className="max-w-4xl mx-auto mt-10">
          <ApplicationResults
            results={applicationResults}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
