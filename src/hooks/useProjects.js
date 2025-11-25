import { useState, useEffect } from 'react';
import { getProjects, saveProjects, addProject as addProjectToStorage, updateProject as updateProjectInStorage, deleteProject as deleteProjectFromStorage } from '../utils/storage';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar projetos ao montar
  useEffect(() => {
    const loadProjects = () => {
      const loadedProjects = getProjects();
      setProjects(loadedProjects);
      setLoading(false);
    };
    
    loadProjects();
  }, []);

  // Adicionar novo projeto
  const addProject = (projectData) => {
    const newProject = addProjectToStorage(projectData);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  // Atualizar projeto
  const updateProject = (id, updates) => {
    const updated = updateProjectInStorage(id, updates);
    if (updated) {
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  };

  // Deletar projeto
  const deleteProject = (id) => {
    const remaining = deleteProjectFromStorage(id);
    setProjects(remaining);
  };

  // Reordenar projetos (para drag and drop)
  const reorderProjects = (newOrder) => {
    setProjects(newOrder);
    saveProjects(newOrder);
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
