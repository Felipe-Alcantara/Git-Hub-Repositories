import { useState, useMemo } from 'react';
// DnD Kit imports para animação em tempo real na reordenação
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Grid3x3, List, Columns, Search, SlidersHorizontal, Tag, X, Trash2, CheckSquare } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';
import ImportExportButtons from '../components/ImportExportButtons';
import { getAllTags } from '../utils/tags';
import { getCustomOrder, saveCustomOrder, getCustomGroups, addCustomGroup } from '../utils/storage';

export default function Home() {
  const { projects, loading, addProject, deleteProject, updateProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
  const [searchTerm, setSearchTerm] = useState('');
  const [filterComplexity, setFilterComplexity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTags, setFilterTags] = useState([]); // Novo filtro de tags
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, name, complexity, custom
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]); // IDs dos projetos selecionados
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null); // Projeto sobre o qual está passando
  const [dragOverColumn, setDragOverColumn] = useState(null); // Coluna kanban sobre a qual está passando
  const [customOrder, setCustomOrder] = useState(() => getCustomOrder()); // Estado local da ordem
  const [newGroupName, setNewGroupName] = useState(''); // Nome do novo grupo
  const [showNewGroupInput, setShowNewGroupInput] = useState(false); // Mostra input de novo grupo
  const [refreshKey, setRefreshKey] = useState(0); // Força re-render dos grupos

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

  // Obter todos os grupos únicos para o kanban
  const kanbanGroups = useMemo(() => {
    const groupsSet = new Set();
    
    // Adiciona grupos customizados salvos
    const customGroups = getCustomGroups();
    customGroups.forEach(g => groupsSet.add(g));
    
    // Adiciona grupos que estão sendo usados nos projetos
    projects.forEach(p => {
      if (p.group) {
        groupsSet.add(p.group);
        // Se o grupo não está salvo, salva automaticamente
        if (!customGroups.includes(p.group)) {
          addCustomGroup(p.group);
        }
      }
    });
    
    return Array.from(groupsSet).sort();
  }, [projects, refreshKey]);

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
          // Usa data do repositório se disponível, senão usa data do card
          const dateA = a.repoCreatedAt || a.createdAt;
          const dateB = b.repoCreatedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA);
        case 'complexity':
          const complexityOrder = { simple: 0, medium: 1, complex: 2, unfeasible: 3 };
          return complexityOrder[a.complexity] - complexityOrder[b.complexity];
        case 'custom':
          // Ordem customizada
          const indexA = customOrder.indexOf(a.id);
          const indexB = customOrder.indexOf(b.id);
          
          // Se ambos estão na ordem customizada
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // Se apenas A está na ordem customizada
          if (indexA !== -1) return -1;
          // Se apenas B está na ordem customizada
          if (indexB !== -1) return 1;
          // Se nenhum está, manter ordem original
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchTerm, filterComplexity, filterStatus, filterTags, sortBy, customOrder]);

  const toggleTagFilter = (tag) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProjects.length === 0) return;
    
    const count = selectedProjects.length;
    if (confirm(`Tem certeza que deseja deletar ${count} ${count === 1 ? 'projeto' : 'projetos'}?`)) {
      selectedProjects.forEach(id => deleteProject(id));
      setSelectedProjects([]);
    }
  };

  const handleSaveProject = (projectData) => {
    addProject(projectData);
    setIsModalOpen(false);
  };

  const handleDeleteProject = (id) => {
    if (confirm('Tem certeza que deseja deletar este projeto?')) {
      deleteProject(id);
      setSelectedProjects(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleDragStart = (e, projectId) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleDragOver = (e, projectId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Só atualiza se mudou de card alvo e não é o próprio card sendo arrastado
    if (projectId !== draggedProject && projectId !== dragOverProject) {
      setDragOverProject(projectId);
    }
  };

  const handleDragLeave = (e) => {
    // Evita limpar quando o mouse está apenas saindo para entrar em um filho
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setDragOverProject(null);
  };

  const handleDrop = (e, targetProjectId) => {
    e.preventDefault();
    
    if (!draggedProject || draggedProject === targetProjectId) {
      setDraggedProject(null);
      return;
    }

    // Pega a ordem atual dos projetos filtrados
    const currentOrder = filteredProjects.map(p => p.id);
    const draggedIndex = currentOrder.indexOf(draggedProject);
    const targetIndex = currentOrder.indexOf(targetProjectId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedProject(null);
      return;
    }

    // Reordena
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedProject);

    // Salva a nova ordem no storage
    saveCustomOrder(newOrder);
    
    // Atualiza o estado local
    setCustomOrder(newOrder);
    
    // Muda para ordenação customizada
    setSortBy('custom');
    
    setDraggedProject(null);
    setDragOverProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverProject(null);
    setDragOverColumn(null);
  };

  // Handlers para drag and drop no Kanban
  const handleKanbanDragOver = (e, columnType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnType);
  };

  const handleKanbanDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleKanbanDrop = (e, columnType) => {
    e.preventDefault();
    
    if (!draggedProject) {
      setDragOverColumn(null);
      return;
    }

    // Encontra o projeto arrastado
    const project = projects.find(p => p.id === draggedProject);
    if (!project) {
      setDraggedProject(null);
      setDragOverColumn(null);
      return;
    }

    // Atualiza o grupo do projeto
    if (project.group !== columnType) {
      updateProject(draggedProject, { group: columnType });
    }

    setDraggedProject(null);
    setDragOverColumn(null);
  };

  const handleCreateNewGroup = () => {
    if (!newGroupName.trim()) return;
    
    const success = addCustomGroup(newGroupName);
    if (success) {
      setNewGroupName('');
      setShowNewGroupInput(false);
      // Force re-render para mostrar novo grupo
      setRefreshKey(prev => prev + 1);
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
      {/* Barra de ações para seleção múltipla */}
      {selectedProjects.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl border border-blue-500 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            <span className="font-medium">{selectedProjects.length} {selectedProjects.length === 1 ? 'projeto selecionado' : 'projetos selecionados'}</span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Deletar
            </button>
            
            <button
              onClick={() => setSelectedProjects([])}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
                {filteredProjects.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedProjects.length === filteredProjects.length
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-bg border border-dark-border text-gray-300 hover:bg-dark-hover'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    {selectedProjects.length === filteredProjects.length ? 'Desselecionar' : 'Selecionar'} Todos
                  </button>
                )}

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
                    <option value="custom">Customizado (arraste para reordenar)</option>
                  </select>
                  {sortBy === 'custom' && (
                    <p className="text-xs text-blue-400 mt-1">
                      💡 Arraste os cards para reordenar
                    </p>
                  )}
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
      <main className={viewMode === 'kanban' ? 'w-full px-4 sm:px-6 lg:px-8 py-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
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
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 h-[calc(100vh-250px)]'
          }>
            {viewMode === 'kanban' ? (
              // Visualização Kanban - Colunas dinâmicas baseadas em grupos
              <>
                {kanbanGroups.map(group => (
                  <KanbanColumn 
                    key={group}
                    title={group.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    columnType={group}
                    projects={filteredProjects.filter(p => p.group === group)}
                    selectedProjects={selectedProjects}
                    onToggleSelect={toggleProjectSelection}
                    onDelete={handleDeleteProject}
                    onDragOver={handleKanbanDragOver}
                    onDragLeave={handleKanbanDragLeave}
                    onDrop={handleKanbanDrop}
                    isDragOver={dragOverColumn === group}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggedProject={draggedProject}
                    dragOverProject={dragOverProject}
                  />
                ))}
                
                {/* Botão para adicionar novo grupo */}
                <div className="bg-dark-surface border border-dashed border-dark-border rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px]">
                  {showNewGroupInput ? (
                    <div className="w-full space-y-3">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateNewGroup()}
                        placeholder="Nome do grupo..."
                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateNewGroup}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Criar
                        </button>
                        <button
                          onClick={() => {
                            setShowNewGroupInput(false);
                            setNewGroupName('');
                          }}
                          className="flex-1 px-3 py-2 bg-dark-hover hover:bg-dark-border text-white text-sm rounded transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewGroupInput(true)}
                      className="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Novo Grupo</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Visualização Grid/List com animação de reorder via DnD Kit
              <DnDSortableProjects
                projects={filteredProjects}
                viewMode={viewMode}
                selectedProjects={selectedProjects}
                onToggleSelect={toggleProjectSelection}
                onDelete={handleDeleteProject}
                onReorder={(newIdsOrder) => {
                  // Persistir nova ordem customizada
                  saveCustomOrder(newIdsOrder);
                  setCustomOrder(newIdsOrder);
                  setSortBy('custom');
                }}
              />
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
function KanbanColumn({ 
  title, 
  projects, 
  onDelete, 
  selectedProjects = [], 
  onToggleSelect,
  columnType,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  onDragStart,
  onDragEnd,
  draggedProject,
  dragOverProject
}) {
  return (
    <div 
      className={`bg-dark-surface border rounded-lg p-4 min-h-[500px] flex flex-col
        transition-all duration-300 ease-in-out
        ${isDragOver ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20' : 'border-dark-border'}
      `}
      onDragOver={(e) => onDragOver(e, columnType)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, columnType)}
    >
      <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between pb-3 border-b border-dark-border">
        {title}
        <span className="text-xs text-gray-400 font-normal bg-dark-border px-2 py-0.5 rounded-full">{projects.length}</span>
      </h3>
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 pt-1" style={{ maxHeight: 'calc(100vh - 340px)' }}>
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project}
            viewMode="kanban"
            isSelected={selectedProjects.includes(project.id)}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            draggable={true}
            onDragStart={(e) => onDragStart(e, project.id)}
            onDragEnd={onDragEnd}
            isDragging={draggedProject === project.id}
            isDragOver={dragOverProject === project.id}
          />
        ))}
      </div>
    </div>
  );
}

// Componente para lista/grid com reordenação animada
function DnDSortableProjects({ projects, viewMode, selectedProjects, onToggleSelect, onDelete, onReorder }) {
  // Sensores (pointer) com pequena distância para ativar drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const projectIds = projects.map(p => p.id);

  const sortingStrategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = projectIds.indexOf(active.id);
    const newIndex = projectIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrderedIds = arrayMove(projectIds, oldIndex, newIndex);
    onReorder(newOrderedIds);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={projectIds} strategy={sortingStrategy}>
        {projects.map(project => (
          <SortableProjectCard
            key={project.id}
            project={project}
            viewMode={viewMode}
            isSelected={selectedProjects.includes(project.id)}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// Wrapper que aplica transformações do DnD Kit ao card
function SortableProjectCard({ project, viewMode, isSelected, onToggleSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    // Suavização adicional
    willChange: 'transform',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard
        project={project}
        viewMode={viewMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
        draggable={false}
        isDragging={isDragging}
      />
    </div>
  );
}
