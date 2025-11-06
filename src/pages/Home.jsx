import { useState, useMemo } from 'react';
import { Plus, Grid3x3, List, Columns, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';
import ImportExportButtons from '../components/ImportExportButtons';
import { getAllTags } from '../utils/tags';

export default function Home() {
  const { projects, loading, addProject, deleteProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
  const [searchTerm, setSearchTerm] = useState('');
  const [filterComplexity, setFilterComplexity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTags, setFilterTags] = useState([]); // Novo filtro de tags
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, name, complexity
  const [showFilters, setShowFilters] = useState(false);

  // Obter todas as tags usadas nos projetos
  const usedTags = useMemo(() => {
    const tagsSet = new Set();
    projects.forEach(p => {
      if (Array.isArray(p.languages)) {
        p.languages.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [projects]);

  // Filtrar e ordenar projetos
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Busca
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.languages?.some(lang => lang.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro de complexidade
    if (filterComplexity !== 'all') {
      filtered = filtered.filter(p => p.complexity === filterComplexity);
    }

    // Filtro de status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => 
        filterStatus === 'completed' ? p.isCompleted : !p.isCompleted
      );
    }

    // Filtro de tags
    if (filterTags.length > 0) {
      filtered = filtered.filter(p => 
        filterTags.every(tag => 
          Array.isArray(p.languages) && p.languages.includes(tag)
        )
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'complexity':
          const complexityOrder = { simple: 0, medium: 1, complex: 2, unfeasible: 3 };
          return complexityOrder[a.complexity] - complexityOrder[b.complexity];
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchTerm, filterComplexity, filterStatus, filterTags, sortBy]);

  const toggleTagFilter = (tag) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSaveProject = (projectData) => {
    addProject(projectData);
    setIsModalOpen(false);
  };

  const handleDeleteProject = (id) => {
    if (confirm('Tem certeza que deseja deletar este projeto?')) {
      deleteProject(id);
    }
  };

  const handleImportComplete = () => {
    window.location.reload(); // Recarregar para mostrar novos projetos
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Título e ações principais */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Meus Projetos</h1>
                <p className="text-gray-400 mt-1">
                  {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
                </p>
              </div>

              <div className="flex gap-3">
                <ImportExportButtons onImportComplete={handleImportComplete} />
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Novo Projeto</span>
                </button>
              </div>
            </div>

            {/* Barra de busca e controles */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar projetos..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Controles de visualização */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showFilters 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-dark-bg border border-dark-border text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                </button>

                <div className="flex bg-dark-bg border border-dark-border rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-dark-hover text-blue-400' : 'text-gray-400'}`}
                    title="Grade"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-dark-hover text-blue-400' : 'text-gray-400'}`}
                    title="Lista"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 ${viewMode === 'kanban' ? 'bg-dark-hover text-blue-400' : 'text-gray-400'}`}
                    title="Kanban"
                  >
                    <Columns className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Painel de filtros */}
            {showFilters && (
              <div className="flex flex-wrap gap-4 p-4 bg-dark-bg border border-dark-border rounded-lg">
                {/* Ordenar por */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-gray-400 mb-2">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="createdAt">Data de criação</option>
                    <option value="name">Nome (A-Z)</option>
                    <option value="complexity">Complexidade</option>
                  </select>
                </div>

                {/* Filtrar por complexidade */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-gray-400 mb-2">Complexidade</label>
                  <select
                    value={filterComplexity}
                    onChange={(e) => setFilterComplexity(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todas</option>
                    <option value="simple">Simples</option>
                    <option value="medium">Médio</option>
                    <option value="complex">Complexo</option>
                    <option value="unfeasible">Inviável</option>
                  </select>
                </div>

                {/* Filtrar por status */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="in-progress">Em andamento</option>
                    <option value="completed">Finalizados</option>
                  </select>
                </div>

                {/* Filtrar por tags */}
                {usedTags.length > 0 && (
                  <div className="w-full">
                    <label className="block text-sm text-gray-400 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Filtrar por Tecnologias
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {usedTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTagFilter(tag)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                            filterTags.includes(tag)
                              ? 'bg-blue-600 text-white'
                              : 'bg-dark-surface border border-dark-border text-gray-300 hover:bg-dark-hover'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                          {filterTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                        </button>
                      ))}
                    </div>
                    {filterTags.length > 0 && (
                      <button
                        onClick={() => setFilterTags([])}
                        className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Limpar filtros de tecnologias
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-4">
              {projects.length === 0 
                ? 'Nenhum projeto ainda. Crie seu primeiro projeto!'
                : 'Nenhum projeto encontrado com os filtros aplicados.'
              }
            </div>
            {projects.length === 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Primeiro Projeto
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : viewMode === 'list'
              ? 'space-y-4'
              : 'grid grid-cols-1 lg:grid-cols-3 gap-6'
          }>
            {viewMode === 'kanban' ? (
              // Visualização Kanban
              <>
                <KanbanColumn 
                  title="Em Andamento"
                  projects={filteredProjects.filter(p => !p.isCompleted)}
                  onDelete={handleDeleteProject}
                />
                <KanbanColumn 
                  title="Finalizados"
                  projects={filteredProjects.filter(p => p.isCompleted)}
                  onDelete={handleDeleteProject}
                />
                <KanbanColumn 
                  title="Todos"
                  projects={filteredProjects}
                  onDelete={handleDeleteProject}
                />
              </>
            ) : (
              // Visualização Grid/List
              filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  onDelete={handleDeleteProject}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      <NewProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
      />
    </div>
  );
}

// Componente auxiliar para colunas Kanban
function KanbanColumn({ title, projects, onDelete }) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
        {title}
        <span className="text-sm text-gray-400 font-normal">{projects.length}</span>
      </h3>
      <div className="space-y-4">
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
