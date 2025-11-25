import { get, set, del } from 'idb-keyval';
import LZString from 'lz-string';

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
export const getProjects = async () => {
  try {
    console.debug('[storage] getProjects: iniciando carregamento (IndexedDB)');
    // Tenta carregar do IndexedDB primeiro
    let data = await get(STORAGE_KEY);
    let projects = [];

    if (data) {
      console.debug('[storage] getProjects: dados encontrados no IndexedDB (comprimento string):', (typeof data === 'string' ? data.length : undefined));
      // Descomprime se necessário
      if (typeof data === 'string' && data.startsWith('LZ')) {
        data = LZString.decompressFromUTF16(data);
      }
      projects = JSON.parse(data);
    } else {
      // Fallback para localStorage (migração)
      try {
        const old = localStorage.getItem('github-projects');
        const current = localStorage.getItem(STORAGE_KEY);
        if (old && !current) {
          localStorage.setItem(STORAGE_KEY, old);
          localStorage.removeItem('github-projects');
          console.log('[storage] Migrei dados de `github-projects` para `github_projects_dashboard`');
        }
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          console.info('[storage] getProjects: dados encontrados no localStorage — migrando para IndexedDB');
          projects = JSON.parse(localData);
          // Migra para IndexedDB
          try {
            await saveProjects(projects);
          } catch (err) {
            console.warn('[storage] getProjects: falha ao migrar do localStorage para IndexedDB — mantendo em localStorage', err);
          }
          localStorage.removeItem(STORAGE_KEY);
          console.log('[storage] Migrei dados do localStorage para IndexedDB');
        }
      } catch (e) {
        console.warn('[storage] Falha na migração do localStorage:', e);
      }
    }
    
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
      try {
        await saveProjects(migratedProjects);
      } catch (err) {
        console.warn('[storage] getProjects: falha ao salvar projetos migrados', err);
      }
    }
    
    return migratedProjects;
  } catch (error) {
    console.error('[storage] getProjects: Erro ao carregar projetos:', error);
    return [];
  }
};

// Salvar todos os projetos
export const saveProjects = async (projects) => {
  try {
    const str = JSON.stringify(projects);
    // Compressa com LZ-String para reduzir armazenamento
    const compressed = LZString.compressToUTF16(str);
    console.debug('[storage] saveProjects: attempting to save to IndexedDB — compressed length:', compressed.length);
    await set(STORAGE_KEY, compressed);
    console.info('[storage] saveProjects: salvo no IndexedDB com sucesso — items:', projects.length);
    return true;
  } catch (error) {
    // Tratar casos comuns
    console.error('[storage] saveProjects: falha ao salvar no IndexedDB:', error);
    // Se for QuotaExceededError ou semelhante, tentar fallback para localStorage (com log claro)
    try {
      if (error && (error.name === 'QuotaExceededError' || /quota/i.test(error.message || ''))) {
        console.warn('[storage] saveProjects: quota excedida no IndexedDB — tentando fallback localStorage (pouco recomendado)');
      }
      // Tentar fallback — NÃO é garantido que localStorage funcione (pode também lançar QuotaExceededError)
      const strFallback = JSON.stringify(projects);
      localStorage.setItem(STORAGE_KEY, strFallback);
      console.warn('[storage] saveProjects: fallback para localStorage realizado (atenção: localStorage tem limites menores)');
      return true;
    } catch (fallbackErr) {
      console.error('[storage] saveProjects: fallback para localStorage falhou:', fallbackErr);
      // Como último recurso, tentamos apagar chaves antigas e registrar erro para investigação
      try {
        await del(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        console.warn('[storage] saveProjects: limpei entradas de storage após falha crítica');
      } catch (cleanupErr) {
        console.error('[storage] saveProjects: falha ao limpar storage após erro:', cleanupErr);
      }
      return false;
    }
  }
};

// Adicionar novo projeto
export const addProject = async (project) => {
  console.debug('[storage] addProject: adicionado/mesclando novo projeto (nome):', project?.name || '(sem nome)');
  const projects = await getProjects();
  const newProject = {
    ...createEmptyProject(),
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  projects.push(newProject);
  const ok = await saveProjects(projects);
  if (!ok) console.error('[storage] addProject: Falha ao persistir novo projeto (saveProjects retornou false)');
  return newProject;
};

// Atualizar projeto existente
export const updateProject = async (id, updates) => {
  console.debug('[storage] updateProject: atualizando projeto', id);
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    lastModified: new Date().toISOString(),
  };
  
  const ok = await saveProjects(projects);
  if (!ok) console.error('[storage] updateProject: Falha ao persistir atualização do projeto', id);
  return projects[index];
};

// Deletar projeto
export const deleteProject = async (id) => {
  console.debug('[storage] deleteProject: removendo projeto', id);
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  const ok = await saveProjects(filtered);
  if (!ok) console.error('[storage] deleteProject: Falha ao persistir remoção do projeto', id);
  return filtered;
};

// Obter projeto por ID
export const getProjectById = async (id) => {
  const projects = await getProjects();
  return projects.find(p => p.id === id);
};

// Exportar projetos para JSON
export const exportProjects = async (projectIds = null) => {
  const projects = await getProjects();
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
export const importProjects = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importedProjects = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedProjects)) {
          throw new Error('Formato inválido: deve ser um array de projetos');
        }
        
        console.debug('[storage] importProjects: carregando projetos atuais para comparação');
        const currentProjects = await getProjects();
        
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
        const ok = await saveProjects(mergedProjects);
        if (!ok) throw new Error('Falha ao salvar projetos importados');
        
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
    console.error('[storage] getAllowDuplicates: falha ao ler configuração', e);
    return false;
  }
};

export const setAllowDuplicates = (value) => {
  try {
    localStorage.setItem(ALLOW_DUPLICATES_KEY, value ? 'true' : 'false');
    return true;
  } catch (e) {
    console.error('[storage] setAllowDuplicates: Erro ao salvar configuração de duplicatas:', e);
    return false;
  }
};

// Limpar todos os dados (útil para testes)
export const clearAllProjects = async () => {
  console.warn('[storage] clearAllProjects: limpando todos os dados de storage (IndexedDB + localStorage)');
  try {
    await del(STORAGE_KEY).catch(() => {});
  } catch (e) {
    console.warn('[storage] clearAllProjects: falha ao limpar chave IndexedDB', e);
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  try {
    localStorage.removeItem(CUSTOM_ORDER_KEY);
  } catch (e) {}
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

// Retorna informações sobre o estado do storage (uso, quota, persistência)
export const getStorageHealth = async () => {
  try {
    if (!('storage' in navigator) || !navigator.storage.estimate) {
      console.warn('[storage] getStorageHealth: navigator.storage.estimate não disponível neste ambiente');
      return { supported: false };
    }

    const estimate = await navigator.storage.estimate();
    const persisted = typeof navigator.storage.persisted === 'function' ? await navigator.storage.persisted() : false;

    // tentar obter tamanho aproximado dos dados do app (comprimido)
    let compressed = null;
    try {
      compressed = await get(STORAGE_KEY);
    } catch (e) {
      console.warn('[storage] getStorageHealth: falha ao ler chave do IndexedDB para estimativa de tamanho', e);
    }

    const compressedSize = compressed ? (typeof compressed === 'string' ? compressed.length : JSON.stringify(compressed).length) : 0;
    // número de projetos aproximado
    let projectsCount = 0;
    try {
      const projects = await getProjects();
      projectsCount = Array.isArray(projects) ? projects.length : 0;
    } catch (e) {
      console.warn('[storage] getStorageHealth: falha ao contar projetos', e);
    }

    return {
      supported: true,
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      persisted,
      compressedSizeEstimate: compressedSize,
      projectsCount,
    };
  } catch (error) {
    console.error('[storage] getStorageHealth: Erro ao recuperar informações de storage:', error);
    return { supported: false, error: String(error) };
  }
};
