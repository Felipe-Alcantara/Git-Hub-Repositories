import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Code2, ExternalLink, Download, Globe, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const complexityColors = {
  simple: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  complex: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  unfeasible: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const complexityLabels = {
  simple: 'Simples',
  medium: 'Médio',
  complex: 'Complexo',
  unfeasible: 'Inviável',
};

export default function ProjectCard({ 
  project, 
  onDelete, 
  isSelected = false, 
  onToggleSelect,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false
}) {
  const navigate = useNavigate();
  const totalLines = Object.values(project.linesOfCode || {}).reduce((sum, lines) => sum + lines, 0);

  const handleCardClick = (e) => {
    // Não navega se clicar em links ou botões
    if (e.target.closest('a') || e.target.closest('button')) {
      return;
    }
    navigate(`/project/${project.id}`);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(project.id);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative bg-dark-surface border rounded-lg p-5 group cursor-pointer
        transition-all duration-300 ease-in-out
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-dark-border'}
        ${isDragging ? 'opacity-40 scale-95 rotate-2 shadow-2xl' : 'hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1'}
        ${isDragOver ? 'border-t-4 border-t-blue-500 shadow-lg shadow-blue-500/30' : ''}
      `}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
            {project.name || 'Projeto sem nome'}
          </h3>
        </div>
        
        {/* Círculo de seleção/status */}
        <button
          onClick={handleCheckboxClick}
          className={`p-1 rounded-full transition-all hover:bg-dark-hover ${
            isSelected 
              ? 'text-blue-400 hover:text-blue-500' 
              : project.isCompleted 
              ? 'text-green-400 hover:text-green-500' 
              : 'text-gray-500 hover:text-gray-400'
          }`}
          title={isSelected ? 'Desselecionar' : project.isCompleted ? 'Concluído - Clique para selecionar' : 'Em andamento - Clique para selecionar'}
        >
          {isSelected ? (
            <CheckCircle2 className="w-6 h-6 fill-current" />
          ) : project.isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Descrição */}
      {project.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Metadados */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(project.repoCreatedAt || project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
        
        {totalLines > 0 && (
          <div className="flex items-center gap-1.5">
            <Code2 className="w-4 h-4" />
            <span>{totalLines.toLocaleString('pt-BR')} linhas</span>
          </div>
        )}
      </div>

      {/* Grupo Kanban */}
      {project.group && (
        <div className="mb-3">
          <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/30">
            📋 {project.group.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        </div>
      )}

      {/* Linguagens */}
      {project.languages && project.languages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.languages.map((lang, idx) => (
            <span 
              key={idx}
              className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/30"
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* Complexidade */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 text-xs rounded-full border ${complexityColors[project.complexity]}`}>
          {complexityLabels[project.complexity]}
        </span>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 mb-4">
        {project.repoUrl && (
          <a 
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-hover text-gray-300 text-xs rounded hover:bg-dark-border transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Repositório
          </a>
        )}
        
        {project.webUrl && (
          <a 
            href={project.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-hover text-gray-300 text-xs rounded hover:bg-dark-border transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Site
          </a>
        )}
        
        {project.downloadUrl && (
          <a 
            href={project.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-hover text-gray-300 text-xs rounded hover:bg-dark-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        )}
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center pt-3 border-t border-dark-border">
        <span className="text-blue-400 text-sm">
          Clique para ver detalhes →
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="text-red-400 text-sm hover:text-red-300 transition-colors"
        >
          Deletar
        </button>
      </div>
    </div>
  );
}
