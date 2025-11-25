import { useState, useEffect } from 'react';
import { getProjects, saveProjects, addProject as addProjectToStorage, updateProject as updateProjectInStorage, deleteProject as deleteProjectFromStorage } from '../utils/storage';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar projetos ao montar
  useEffect(() => {
    const loadProjects = async () => {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);
      setLoading(false);
    };
    
    loadProjects();
  }, []);

  // Adicionar novo projeto
  const addProject = async (projectData) => {
    const newProject = await addProjectToStorage(projectData);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  // Atualizar projeto
  const updateProject = async (id, updates) => {
    const updated = await updateProjectInStorage(id, updates);
    if (updated) {
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  // Deletar projeto
  const deleteProject = async (id) => {
    const remaining = await deleteProjectFromStorage(id);
    setProjects(remaining);
  };

  // Reordenar projetos (para drag and drop)
  const reorderProjects = async (newOrder) => {
    setProjects(newOrder);
    await saveProjects(newOrder);
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
