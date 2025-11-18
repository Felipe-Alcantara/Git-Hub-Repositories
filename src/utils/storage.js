const STORAGE_KEY = 'github_projects_dashboard';
const CUSTOM_ORDER_KEY = 'github_projects_custom_order';
const CUSTOM_GROUPS_KEY = 'github_projects_custom_groups';
const ALLOW_DUPLICATES_KEY = 'github_projects_allow_duplicates';

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
    readme: '', // README do projeto
    ideas: '',
    improvements: '',
    problems: '',
    purpose: '',
    users: '',
    mvp: '',
    stack: '',
    upgrades: '',
    structure: null, // Estrutura de pastas/arquivos do projeto (array)
    sketches: '', // Canvas de desenho salvo como base64
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
      details: {
        readme: '', // Adiciona campo readme se não existir
        ideas: '',
        improvements: '',
        problems: '',
        purpose: '',
        users: '',
        mvp: '',
        stack: '',
        upgrades: '',
        structure: null, // Adiciona campo de estrutura se não existir
        sketches: '', // Adiciona campo de sketches se não existir
        ...project.details,
      }
    }));
    
    // Salva de volta se houve mudanças
    if (projects.length > 0 && (projects.some(p => !p.group) || projects.some(p => !p.details?.sketches))) {
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

        // Evita importar duplicatas: compara por repoUrl / webUrl / nome (caso repoUrl vazio)
        const existingKeys = new Set(currentProjects.map(p => ((p.repoUrl || p.webUrl || p.name) || '').toString().trim().toLowerCase()));

        // Se estiver habilitado permitir duplicatas, tudo é importado sem filtragem
        const allowDuplicates = localStorage.getItem(ALLOW_DUPLICATES_KEY) === 'true';
        const filteredToAdd = allowDuplicates ? processedProjects : processedProjects.filter(p => {
          const key = ((p.repoUrl || p.webUrl || p.name) || '').toString().trim().toLowerCase();
          if (!key) return true; // projetos sem chave serão adicionados
          return !existingKeys.has(key);
        });

        const mergedProjects = [...currentProjects, ...filteredToAdd];
        saveProjects(mergedProjects);
        
        resolve({
          success: true,
          imported: filteredToAdd.length,
          projects: filteredToAdd,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// Permitir duplicatas ao importar (config)
export const getAllowDuplicates = () => {
  try {
    const v = localStorage.getItem(ALLOW_DUPLICATES_KEY);
    return v === 'true';
  } catch (e) {
    return false;
  }
};

export const setAllowDuplicates = (value) => {
  try {
    localStorage.setItem(ALLOW_DUPLICATES_KEY, value ? 'true' : 'false');
    return true;
  } catch (e) {
    console.error('Erro ao salvar configuração de duplicatas:', e);
    return false;
  }
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

// ==================== GRUPOS CUSTOMIZADOS ====================

// Obter grupos customizados
export const getCustomGroups = () => {
  try {
    const data = localStorage.getItem(CUSTOM_GROUPS_KEY);
    const savedGroups = data ? JSON.parse(data) : [];
    
    // Se não há dados salvos, retorna ordem padrão
    if (savedGroups.length === 0) {
      return ['backlog', 'in-progress', 'completed'];
    }
    
    // Garante que grupos padrão estejam presentes
    const defaultGroups = ['backlog', 'in-progress', 'completed'];
    const allGroups = new Set([...savedGroups]);
    
    // Adiciona grupos padrão que estão faltando no final
    defaultGroups.forEach(g => {
      if (!allGroups.has(g)) {
        savedGroups.push(g);
      }
    });
    
    return savedGroups;
  } catch (error) {
    console.error('Erro ao carregar grupos customizados:', error);
    return ['backlog', 'in-progress', 'completed'];
  }
};

// Adicionar grupo customizado
export const addCustomGroup = (groupName) => {
  try {
    const groups = getCustomGroups();
    const normalizedName = groupName.toLowerCase().trim().replace(/\s+/g, '-');
    
    if (!normalizedName || groups.includes(normalizedName)) {
      return false; // Já existe ou nome inválido
    }
    
    groups.push(normalizedName);
    localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify(groups));
    return true;
  } catch (error) {
    console.error('Erro ao adicionar grupo customizado:', error);
    return false;
  }
};

// Remover grupo customizado
export const removeCustomGroup = (groupName) => {
  try {
    const groups = getCustomGroups();
    const defaultGroups = ['backlog', 'in-progress', 'completed'];
    
    // Não permite remover grupos padrão
    if (defaultGroups.includes(groupName)) {
      return false;
    }
    
    const filtered = groups.filter(g => g !== groupName);
    localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Erro ao remover grupo customizado:', error);
    return false;
  }
};

// Limpar grupos customizados
export const clearCustomGroups = () => {
  localStorage.removeItem(CUSTOM_GROUPS_KEY);
};

// Salvar ordem customizada dos grupos
export const saveGroupsOrder = (orderedGroups) => {
  try {
    localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify(orderedGroups));
    return true;
  } catch (error) {
    console.error('Erro ao salvar ordem dos grupos:', error);
    return false;
  }
};

export function deleteCustomGroup(groupName) {
  const currentGroups = getCustomGroups();
  if (!currentGroups.includes(groupName)) {
    console.warn(`Tentativa de deletar um grupo que não existe: ${groupName}`);
    return false;
  }
  const newGroups = currentGroups.filter(g => g !== groupName);
  localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify(newGroups));
  return true;
}
