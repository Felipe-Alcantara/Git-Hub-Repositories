const STORAGE_KEY = 'github_projects_dashboard';
const CUSTOM_ORDER_KEY = 'github_projects_custom_order';

// Estrutura de um projeto
export const createEmptyProject = () => ({
  id: crypto.randomUUID(),
  name: '',
  createdAt: new Date().toISOString(), // Data de criação do card
  repoCreatedAt: null, // Data de criação do repositório no GitHub
  description: '',
  languages: [],
  repoUrl: '',
  downloadUrl: '',
  webUrl: '',
  isCompleted: false,
  complexity: 'simple', // simple, medium, complex, unfeasible
  linesOfCode: {},
  
  // Detalhes expandidos
  details: {
    ideas: '',
    improvements: '',
    problems: '',
    purpose: '',
    users: '',
    mvp: '',
    stack: '',
    upgrades: '',
  },
  
  // Metadados
  group: 'backlog', // backlog, in-progress, completed, archived
  tags: [],
  lastModified: new Date().toISOString(),
});

// Obter todos os projetos
export const getProjects = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const projects = data ? JSON.parse(data) : [];
    
    // Migração: adiciona campo 'group' em projetos antigos
    const migratedProjects = projects.map(project => ({
      ...project,
      group: project.group || 'backlog', // Define 'backlog' como padrão se não existir
    }));
    
    // Salva de volta se houve mudanças
    if (projects.length > 0 && projects.some(p => !p.group)) {
      saveProjects(migratedProjects);
    }
    
    return migratedProjects;
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    return [];
  }
};

// Salvar todos os projetos
export const saveProjects = (projects) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (error) {
    console.error('Erro ao salvar projetos:', error);
    return false;
  }
};

// Adicionar novo projeto
export const addProject = (project) => {
  const projects = getProjects();
  const newProject = {
    ...createEmptyProject(),
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
};

// Atualizar projeto existente
export const updateProject = (id, updates) => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    lastModified: new Date().toISOString(),
  };
  
  saveProjects(projects);
  return projects[index];
};

// Deletar projeto
export const deleteProject = (id) => {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  saveProjects(filtered);
  return filtered;
};

// Obter projeto por ID
export const getProjectById = (id) => {
  const projects = getProjects();
  return projects.find(p => p.id === id);
};

// Exportar projetos para JSON
export const exportProjects = (projectIds = null) => {
  const projects = getProjects();
  const toExport = projectIds 
    ? projects.filter(p => projectIds.includes(p.id))
    : projects;
  
  const dataStr = JSON.stringify(toExport, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `github-projects-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Importar projetos de JSON
export const importProjects = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedProjects = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedProjects)) {
          throw new Error('Formato inválido: deve ser um array de projetos');
        }
        
        const currentProjects = getProjects();
        
        // Gerar novos IDs para evitar conflitos
        const processedProjects = importedProjects.map(project => ({
          ...project,
          id: crypto.randomUUID(),
          lastModified: new Date().toISOString(),
        }));
        
        const mergedProjects = [...currentProjects, ...processedProjects];
        saveProjects(mergedProjects);
        
        resolve({
          success: true,
          imported: processedProjects.length,
          projects: processedProjects,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// Limpar todos os dados (útil para testes)
export const clearAllProjects = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CUSTOM_ORDER_KEY);
};

// Obter ordem customizada
export const getCustomOrder = () => {
  try {
    const data = localStorage.getItem(CUSTOM_ORDER_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar ordem customizada:', error);
    return [];
  }
};

// Salvar ordem customizada
export const saveCustomOrder = (projectIds) => {
  try {
    localStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(projectIds));
    return true;
  } catch (error) {
    console.error('Erro ao salvar ordem customizada:', error);
    return false;
  }
};

// Limpar ordem customizada
export const clearCustomOrder = () => {
  localStorage.removeItem(CUSTOM_ORDER_KEY);
};
