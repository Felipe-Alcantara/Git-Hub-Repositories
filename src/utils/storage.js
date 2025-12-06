import { get, set, del, clear } from 'idb-keyval';

const STORAGE_KEY = 'github_projects_dashboard';
const CUSTOM_ORDER_KEY = 'github_projects_custom_order';
const CUSTOM_GROUPS_KEY = 'github_projects_custom_groups';
const ALLOW_DUPLICATES_KEY = 'github_projects_allow_duplicates';

// Estrutura de um projeto
export const createEmptyProject = () => ({
  id: crypto.randomUUID(),
  name: '',
  createdAt: new Date().toISOString(),
  repoCreatedAt: null,
  description: '',
  languages: [],
  repoUrl: '',
  downloadUrl: '',
  webUrl: '',
  isCompleted: false,
  complexity: 'simple',
  linesOfCode: {},
  details: {
    readme: '',
    ideas: '',
    improvements: '',
    problems: '',
    purpose: '',
    users: '',
    mvp: '',
    stack: '',
    upgrades: '',
    structure: null,
    sketches: '',
  },
  group: 'backlog',
  tags: [],
  lastModified: new Date().toISOString(),
});

// Obter todos os projetos
export const getProjects = async () => {
  try {
    // Migração do localStorage para IndexedDB na primeira execução
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      console.log('[storage] Migrando dados do localStorage para IndexedDB...');
      const projects = JSON.parse(localData);
      await set(STORAGE_KEY, projects);
      localStorage.removeItem(STORAGE_KEY);
      console.log('[storage] Migração concluída.');
    }

    const projects = await get(STORAGE_KEY) || [];
    console.debug('[storage] getProjects - dados lidos do IndexedDB:', projects?.length || 0, 'projetos');
    
    // Migração de estrutura de dados (se necessário)
    const migratedProjects = projects.map(project => ({
      ...project,
      group: project.group || 'backlog',
      details: {
        readme: '',
        ideas: '',
        improvements: '',
        problems: '',
        purpose: '',
        users: '',
        mvp: '',
        stack: '',
        upgrades: '',
        structure: null,
        sketches: '',
        ...project.details,
      }
    }));
    
    if (projects.length > 0 && (projects.some(p => !p.group) || projects.some(p => !p.details?.sketches))) {
      console.info('[storage] getProjects - detectei projeto(s) com formato antigo, executando migração e salvando');
      await saveProjects(migratedProjects);
    }
    
    return migratedProjects;
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    return [];
  }
};

// Salvar todos os projetos
export const saveProjects = async (projects) => {
  try {
    console.debug('[storage] saveProjects - salvando', projects?.length || 0, 'projetos');
    await set(STORAGE_KEY, projects);
    console.info('[storage] saveProjects - salvou com sucesso');
    return true;
  } catch (error) {
    console.error('[storage] saveProjects - Erro ao salvar projetos:', error);
    return false;
  }
};

// Adicionar novo projeto
export const addProject = async (project) => {
  const projects = await getProjects();
  const newProject = {
    ...createEmptyProject(),
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
  console.debug('[storage] addProject - adicionando novo projeto:', newProject.name || '<sem nome>', newProject.id);
  projects.push(newProject);
  const ok = await saveProjects(projects);
  if (!ok) console.error('[storage] addProject - falha ao salvar após adicionar projeto', newProject.id);
  return newProject;
};

// Atualizar projeto existente
export const updateProject = async (id, updates) => {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    lastModified: new Date().toISOString(),
  };
  
  console.debug('[storage] updateProject - atualizando projeto', id, 'com', updates);
  const ok = await saveProjects(projects);
  if (!ok) console.error('[storage] updateProject - falha ao salvar projeto atualizado', id);
  return projects[index];
};

// Deletar projeto
export const deleteProject = async (id) => {
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  console.debug('[storage] deleteProject - removendo projeto', id);
  const ok = await saveProjects(filtered);
  if (!ok) console.error('[storage] deleteProject - falha ao salvar após remover projeto', id);
  return filtered;
};

// Obter projeto por ID
export const getProjectById = async (id) => {
  const projects = await getProjects();
  console.debug('[storage] getProjectById - buscando id:', id);
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
  
  console.info('[storage] exportProjects - preparando arquivo com', toExport.length, 'projetos para download');
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
    
    reader.onload = async (e) => {
      try {
        const importedProjects = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedProjects)) {
          console.warn('[storage] importProjects - arquivo não é um array de projetos');
          throw new Error('Formato inválido: deve ser um array de projetos');
        }
        
        console.info('[storage] importProjects - processando arquivo com', importedProjects.length, 'items');
        const currentProjects = await getProjects();
        
        // Gerar novos IDs para evitar conflitos
        const processedProjects = importedProjects.map((project, idx) => ({
          ...project,
          id: crypto.randomUUID(),
          lastModified: new Date().toISOString(),
        }));

        // Evita importar duplicatas: compara por repoUrl / webUrl / nome (caso repoUrl vazio)
        const existingKeys = new Set(currentProjects.map(p => ((p.repoUrl || p.webUrl || p.name) || '').toString().trim().toLowerCase()));

        // Se estiver habilitado permitir duplicatas, tudo é importado sem filtragem
        const allowDuplicates = await getAllowDuplicates();
        const filteredToAdd = allowDuplicates ? processedProjects : processedProjects.filter(p => {
          const key = ((p.repoUrl || p.webUrl || p.name) || '').toString().trim().toLowerCase();
          if (!key) return true; // projetos sem chave serão adicionados
          return !existingKeys.has(key);
        });
        console.debug('[storage] importProjects - permitidas duplicatas?', allowDuplicates, '-> adicionando', filteredToAdd.length, 'projetos');
        const mergedProjects = [...currentProjects, ...filteredToAdd];
        await saveProjects(mergedProjects);
        
        console.info('[storage] importProjects - import finalizado, itens importados:', filteredToAdd.length);
        resolve({
          success: true,
          imported: filteredToAdd.length,
          projects: filteredToAdd,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      console.error('[storage] importProjects - erro na leitura do arquivo');
      reject(new Error('Erro ao ler arquivo'));
    };
    reader.readAsText(file);
  });
};

// Permitir duplicatas ao importar (config)
export const getAllowDuplicates = async () => {
  try {
    // Migração
    const localVal = localStorage.getItem(ALLOW_DUPLICATES_KEY);
    if (localVal !== null) {
        await set(ALLOW_DUPLICATES_KEY, localVal);
        localStorage.removeItem(ALLOW_DUPLICATES_KEY);
    }

    const v = await get(ALLOW_DUPLICATES_KEY);
    console.debug('[storage] getAllowDuplicates - valor:', v);
    return v === 'true';
  } catch (e) {
    return false;
  }
};

export const setAllowDuplicates = async (value) => {
  try {
    console.debug('[storage] setAllowDuplicates - definindo para', value);
    await set(ALLOW_DUPLICATES_KEY, value ? 'true' : 'false');
    return true;
  } catch (e) {
    console.error('[storage] setAllowDuplicates - Erro ao salvar configuração de duplicatas:', e);
    return false;
  }
};

// Limpar todos os dados (útil para testes)
export const clearAllProjects = async () => {
  console.warn('[storage] clearAllProjects - removendo todas as chaves relacionadas a projetos do IndexedDB');
  await del(STORAGE_KEY);
  await del(CUSTOM_ORDER_KEY);
};

// Obter ordem customizada
export const getCustomOrder = async () => {
  try {
    // Migração
    const localData = localStorage.getItem(CUSTOM_ORDER_KEY);
    if (localData) {
        await set(CUSTOM_ORDER_KEY, JSON.parse(localData));
        localStorage.removeItem(CUSTOM_ORDER_KEY);
    }

    const data = await get(CUSTOM_ORDER_KEY);
    console.debug('[storage] getCustomOrder - raw value:', data);
    return data || [];
  } catch (error) {
    console.error('[storage] getCustomOrder - Erro ao carregar ordem customizada:', error);
    return [];
  }
};

// Salvar ordem customizada
export const saveCustomOrder = async (projectIds) => {
  try {
    console.debug('[storage] saveCustomOrder - salvando ordem personalizada (items):', projectIds?.length || 0);
    await set(CUSTOM_ORDER_KEY, projectIds);
    return true;
  } catch (error) {
    console.error('[storage] saveCustomOrder - Erro ao salvar ordem customizada:', error);
    return false;
  }
};

// Limpar ordem customizada
export const clearCustomOrder = async () => {
  await del(CUSTOM_ORDER_KEY);
};

// ==================== GRUPOS CUSTOMIZADOS ====================

// Obter grupos customizados
export const getCustomGroups = async () => {
  try {
    // Migração
    const localData = localStorage.getItem(CUSTOM_GROUPS_KEY);
    if (localData) {
        await set(CUSTOM_GROUPS_KEY, JSON.parse(localData));
        localStorage.removeItem(CUSTOM_GROUPS_KEY);
    }

    const savedGroups = await get(CUSTOM_GROUPS_KEY) || [];
    console.debug('[storage] getCustomGroups - grupos encontrados:', savedGroups);
    
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
    console.error('[storage] getCustomGroups - Erro ao carregar grupos customizados:', error);
    return ['backlog', 'in-progress', 'completed'];
  }
};

// Adicionar grupo customizado
export const addCustomGroup = async (groupName) => {
  try {
    console.debug('[storage] addCustomGroup - tentando adicionar grupo:', groupName);
    const groups = await getCustomGroups();
    const normalizedName = groupName.toLowerCase().trim().replace(/\s+/g, '-');
    
    if (!normalizedName || groups.includes(normalizedName)) {
      return false; // Já existe ou nome inválido
    }
    
    groups.push(normalizedName);
    await set(CUSTOM_GROUPS_KEY, groups);
    console.info('[storage] addCustomGroup - grupo adicionado:', normalizedName);
    return true;
  } catch (error) {
    console.error('[storage] addCustomGroup - Erro ao adicionar grupo customizado:', error);
    return false;
  }
};

// Remover grupo customizado
export const removeCustomGroup = async (groupName) => {
  try {
    console.debug('[storage] removeCustomGroup - removendo grupo:', groupName);
    const groups = await getCustomGroups();
    const defaultGroups = ['backlog', 'in-progress', 'completed'];
    
    // Não permite remover grupos padrão
    if (defaultGroups.includes(groupName)) {
      return false;
    }
    
    const filtered = groups.filter(g => g !== groupName);
    await set(CUSTOM_GROUPS_KEY, filtered);
    console.info('[storage] removeCustomGroup - grupo removido:', groupName);
    return true;
  } catch (error) {
    console.error('[storage] removeCustomGroup - Erro ao remover grupo customizado:', error);
    return false;
  }
};

// Limpar grupos customizados
export const clearCustomGroups = async () => {
  console.warn('[storage] clearCustomGroups - limpando grupos customizados do IndexedDB');
  await del(CUSTOM_GROUPS_KEY);
};

// Salvar ordem customizada dos grupos
export const saveGroupsOrder = async (orderedGroups) => {
  try {
    console.debug('[storage] saveGroupsOrder - salvando ordem de grupos:', orderedGroups);
    await set(CUSTOM_GROUPS_KEY, orderedGroups);
    return true;
  } catch (error) {
    console.error('[storage] saveGroupsOrder - Erro ao salvar ordem dos grupos:', error);
    return false;
  }
};

export async function deleteCustomGroup(groupName) {
  const currentGroups = await getCustomGroups();
  if (!currentGroups.includes(groupName)) {
    console.warn(`Tentativa de deletar um grupo que não existe: ${groupName}`);
    return false;
  }
  const newGroups = currentGroups.filter(g => g !== groupName);
  await set(CUSTOM_GROUPS_KEY, newGroups);
  return true;
}
