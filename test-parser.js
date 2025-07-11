const fs = require('fs');
const path = require('path');

// Simula o parser de currículo
function extractResumeData(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('📄 Processando texto do currículo...');
  console.log('📄 Primeiras 10 linhas:', lines.slice(0, 10));
  
  // Extrair nome
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
  
  // Calcular anos de experiência total
  const totalYearsExperience = calculateTotalExperience(experience);
  
  // Calcular experiência por tecnologia
  const experienceByTechnology = calculateExperienceByTechnology(experience);
  
  const resumeData = {
    name,
    email,
    phone,
    location,
    skills,
    experience,
    education,
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

function extractName(lines) {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Padrão mais flexível para nomes
    const nameMatch = line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/);
    if (nameMatch && !line.toLowerCase().includes('email') && !line.toLowerCase().includes('phone') && !line.toLowerCase().includes('@')) {
      return nameMatch[0];
    }
  }
  return 'Nome não encontrado';
}

function extractEmail(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : 'email@example.com';
}

function extractPhone(text) {
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : undefined;
}

function extractLocation(lines) {
  for (const line of lines) {
    if (line.match(/[A-Z][a-z]+, [A-Z]{2}/) || line.match(/[A-Z][a-z]+, [A-Z][a-z]+/)) {
      return line;
    }
  }
  return undefined;
}

function extractSkills(text) {
  const skills = [];
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
  
  return skills.slice(0, 15);
}

function extractExperience(lines) {
  const experience = [];
  const experienceKeywords = ['experience', 'work', 'employment', 'job', 'career', 'professional', 'experiência'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      console.log('🔍 Encontrada seção de experiência na linha:', i, lines[i]);
      
      // Procura por experiências nas próximas linhas
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const expLine = lines[j];
        console.log('📝 Analisando linha:', j, expLine);
        
        // Padrão mais flexível: Título na Empresa | Data
        const expMatch = expLine.match(/(.+?)\s+(?:at|@|in|\||na)\s+(.+?)\s*[-|]\s*(.+)/i);
        if (expMatch) {
          console.log('✅ Experiência encontrada:', expMatch);
          
          const title = expMatch[1].trim();
          const company = expMatch[2].trim();
          const duration = expMatch[3].trim();
          
          let description = '';
          let technologies = [];
          
          // Procura por descrição nas próximas linhas
          for (let k = j + 1; k < Math.min(j + 8, lines.length); k++) {
            const descLine = lines[k];
            if (descLine.length > 10 && !descLine.match(/^\d{4}/) && !descLine.toLowerCase().includes('education')) {
              description += descLine + ' ';
              
              const techKeywords = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'TypeScript', 'MongoDB', 'PostgreSQL'];
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
            yearsInRole = currentYear - startYear;
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
          
          console.log('📊 Experiência processada:', { title, company, duration, yearsInRole, technologies });
          j += 3;
        }
      }
    }
  }
  
  return experience.slice(0, 5);
}

function extractEducation(lines) {
  const education = [];
  const educationKeywords = ['education', 'academic', 'degree', 'university', 'college'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const eduLine = lines[j];
        
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
  
  return education.slice(0, 3);
}

function calculateTotalExperience(experience) {
  let totalYears = 0;
  experience.forEach(exp => {
    if (exp.yearsInRole) {
      totalYears += exp.yearsInRole;
    } else {
      const duration = exp.duration.toLowerCase();
      const years = duration.match(/(\d+)\s*(?:year|ano)/i);
      const months = duration.match(/(\d+)\s*(?:month|mes|mês)/i);
      
      if (years) totalYears += parseInt(years[1]);
      if (months) totalYears += parseInt(months[1]) / 12;
    }
  });
  return Math.round(totalYears * 10) / 10;
}

function calculateExperienceByTechnology(experience) {
  const techExperience = {};
  
  experience.forEach(exp => {
    const yearsInRole = exp.yearsInRole || 1;
    
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

// Teste
const text = fs.readFileSync('test-resume.txt', 'utf8');
const result = extractResumeData(text);
console.log('\n🎯 RESULTADO FINAL:');
console.log(JSON.stringify(result, null, 2)); 