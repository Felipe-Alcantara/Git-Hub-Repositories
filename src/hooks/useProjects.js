import { useState, useEffect } from 'react';
import { getProjects, saveProjects, addProject as addProjectToStorage, updateProject as updateProjectInStorage, deleteProject as deleteProjectFromStorage } from '../utils/storage';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar projetos ao montar
  useEffect(() => {
    const loadProjects = async () => {
      console.debug('[useProjects] loadProjects - carregando projetos do storage');
      const loadedProjects = await getProjects();
      console.info('[useProjects] loadProjects - encontrados', loadedProjects.length, 'projetos');
      setProjects(loadedProjects);
      setLoading(false);
    };
    
    loadProjects();
  }, []);

  // Adicionar novo projeto
  const addProject = async (projectData) => {
    console.debug('[useProjects] addProject - recebendo dados:', projectData?.name || '<sem nome>');
    const newProject = await addProjectToStorage(projectData);
    console.info('[useProjects] addProject - projeto criado com id:', newProject.id);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  // Atualizar projeto
  const updateProject = async (id, updates) => {
    console.debug('[useProjects] updateProject - atualizando', id, updates);
    const updated = await updateProjectInStorage(id, updates);
    if (updated) {
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      console.info('[useProjects] updateProject - atualização salva para id:', id);
    }
    return updated;
  };

  // Deletar projeto
  const deleteProject = async (id) => {
    console.debug('[useProjects] deleteProject - solicitada remoção do id:', id);
    const remaining = await deleteProjectFromStorage(id);
    console.info('[useProjects] deleteProject - removido id:', id, '-> restante:', remaining.length);
    setProjects(remaining);
  };

  // Reordenar projetos (para drag and drop)
  const reorderProjects = async (newOrder) => {
    console.debug('[useProjects] reorderProjects - salvando nova ordem de projetos (items):', newOrder?.length || 0);
    setProjects(newOrder);
    const ok = await saveProjects(newOrder);
    if (!ok) console.error('[useProjects] reorderProjects - falha ao salvar nova ordem');
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
  };
}
