import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Code2, ExternalLink, Download, Globe, CheckCircle2, Circle, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

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
  isDragOver = false,
  viewMode = 'grid',
  index
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const totalLines = Object.values(project.linesOfCode || {}).reduce((sum, lines) => sum + lines, 0);

  const handleCardClick = (e) => {
    // Não navega se clicar em links ou botões
    if (e.target.closest('a') || e.target.closest('button')) {
      return;
    }
    navigate(`/project/${project.id}`, {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash
        }
      }
    });
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onToggleSelect) {
      // Propaga se Shift está pressionado para seleção por intervalo
      onToggleSelect(project.id, { shiftKey: e.shiftKey });
    }
  };

  const hasReadme = Boolean(project.details?.readme && project.details?.readme.trim().length > 0);

  // Layout compacto estilo post-it para modo Kanban
  if (viewMode === 'kanban') {
    return (
      <div 
        onClick={handleCardClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`relative bg-dark-surface border rounded-md p-3 group cursor-pointer
          transition-all duration-200 ease-in-out
          ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-md shadow-blue-500/10' : 'border-dark-border hover:border-blue-500/50 hover:shadow-sm'}
          ${isDragging ? 'opacity-50 rotate-3 scale-95' : ''}
          ${isDragOver ? 'border-t-2 border-t-blue-500' : ''}
        `}
        style={{
          cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
        }}
      >
        {/* Header compacto */}
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={handleCheckboxClick}
            className={`flex-shrink-0 transition-all ${
              isSelected 
                ? 'text-blue-400' 
                : project.isCompleted 
                ? 'text-green-400' 
                : 'text-gray-500'
            }`}
          >
            {isSelected ? (
              <CheckCircle2 className="w-4 h-4 fill-current" />
            ) : project.isCompleted ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          
          <h3 className="text-sm font-semibold text-white flex-1 line-clamp-2 leading-tight">
            {project.name || 'Projeto sem nome'}
          </h3>
        </div>

        {/* Nome do autor/owner */}
        {project.owner && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-gray-500">por</span>
            <a
              href={`https://github.com/${project.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              @{project.owner}
            </a>
          </div>
        )}

        {/* Descrição compacta */}
        {project.description && (
          <p className="text-xs text-gray-400 mb-2">
            {project.description}
          </p>
        )}

        {/* Linguagens (max 3 badges) */}
        {project.languages && project.languages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {project.languages.slice(0, 3).map((lang, idx) => (
              <span 
                key={idx}
                className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30"
              >
                {lang}
              </span>
            ))}
            {project.languages.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-500/10 text-gray-400 text-xs rounded">
                +{project.languages.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer compacto */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-dark-border">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-xs ${complexityColors[project.complexity]}`}>
              {complexityLabels[project.complexity]}
            </span>
            {totalLines > 0 && (
              <span>{(totalLines / 1000).toFixed(0)}k</span>
            )}
            {/* Indicação de README */}
            <div className="ml-2 flex items-center gap-1">
              {hasReadme ? (
                <div title="README disponível" className="flex items-center gap-1 text-green-400">
                  <FileText className="w-3 h-3" />
                  <span className="text-xs text-green-300">README</span>
                </div>
              ) : (
                <div title="Sem README" className="flex items-center gap-1 text-gray-400">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">Sem README</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // Layout compacto para modo lista (estilo GitHub)
  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`relative bg-dark-surface border border-dark-border rounded-lg p-4 mb-3 group cursor-pointer
          transition-all duration-200 ease-in-out
          ${isSelected ? 'bg-blue-500/5 border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10' : 'hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5'}
          ${isDragging ? 'opacity-40 scale-98' : ''}
          ${isDragOver ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20' : ''}
        `}
        style={{
          cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
        }}
      >
        <div className="flex items-start gap-3">
          {/* Círculo de seleção */}
          <button
            onClick={handleCheckboxClick}
            className={`flex-shrink-0 p-1 rounded-full transition-all hover:bg-dark-border ${
              isSelected 
                ? 'text-blue-400 hover:text-blue-500' 
                : project.isCompleted 
                ? 'text-green-400 hover:text-green-500' 
                : 'text-gray-500 hover:text-gray-400'
            }`}
            title={isSelected ? 'Desselecionar' : project.isCompleted ? 'Concluído' : 'Em andamento'}
          >
            {isSelected ? (
              <CheckCircle2 className="w-5 h-5 fill-current" />
            ) : project.isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            {/* Título */}
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors break-normal line-clamp-2 mb-2">
              {project.name || 'Projeto sem nome'}
            </h3>

            {/* Nome do autor/owner */}
            {project.owner && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">por</span>
                <a
                  href={`https://github.com/${project.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                >
                  @{project.owner}
                </a>
              </div>
            )}

            {/* Descrição - ocupa metade do card */}
            {project.description && (
              <p className="text-gray-400 text-sm mb-2 max-w-[50%]">
                {project.description}
              </p>
            )}

            {/* Stack completa - todas as linguagens visíveis */}
            {project.languages && project.languages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {project.languages.map((lang, idx) => (
                  <span key={idx} className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {lang}
                  </span>
                ))}
              </div>
            )}

            {/* Metadados inline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              {/* Data */}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Criado em {format(new Date(project.repoCreatedAt || project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>

              {/* Linhas de código */}
              {totalLines > 0 && (
                <div className="flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  <span>{totalLines.toLocaleString('pt-BR')} linhas</span>
                </div>
              )}

              {/* Indicação de README */}
              <div className="flex items-center gap-1">
                {hasReadme ? (
                  <div title="README disponível" className="flex items-center gap-1 text-green-400">
                    <FileText className="w-3 h-3" />
                    <span className="text-xs text-green-300">README</span>
                  </div>
                ) : (
                  <div title="Sem README" className="flex items-center gap-1 text-gray-400">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">Sem README</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações e badges lado direito */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {/* Ícones de ação */}
            <div className="flex items-center gap-2">
              {project.repoUrl && (
                <a 
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Repositório"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Deletar"
              >
                {/* Usar ícone Trash2 (tamanho consistente com outros ícones) */}
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Complexidade */}
            <span className={`px-2 py-0.5 text-xs rounded border ${complexityColors[project.complexity]}`}>
              {complexityLabels[project.complexity]}
            </span>

            {/* Grupo Kanban */}
            {project.group && (
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30">
                📋 {project.group.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            )}

            {/* Badge README para modos com ações */}
            <div className="mt-1">
              {hasReadme ? (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/30">
                  <FileText className="inline w-3 h-3 mr-1" /> README
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-800/30 text-gray-400 text-xs rounded border border-gray-700/30">
                  <AlertCircle className="inline w-3 h-3 mr-1" /> Sem README
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Numeração no canto inferior esquerdo - apenas para modo lista */}
        {viewMode === 'list' && index && (
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 font-medium">
            #{index}
          </div>
        )}
      </div>
    );
  }

  // Layout padrão para grid/kanban
  return (
    <div 
      onClick={handleCardClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative flex flex-col bg-dark-surface border rounded-lg p-5 group cursor-pointer min-h-[520px]
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
      {/* Conteúdo principal que se expande */}
      <div className="flex-grow">
        {/* Header */}
        <div className="relative mb-3 h-[72px] flex items-end">
          {/* Círculo de seleção/status - posicionado absolutamente */}
          <button
            onClick={handleCheckboxClick}
            className={`absolute -left-1 -top-2 p-1 rounded-full transition-all hover:bg-dark-hover z-10 ${
              isSelected 
                ? 'text-blue-400 hover:text-blue-500' 
                : project.isCompleted 
                ? 'text-green-400 hover:text-green-500' 
                : 'text-gray-500 hover:text-gray-400'
            }`}
            title={isSelected ? 'Desselecionar' : project.isCompleted ? 'Concluído - Clique para selecionar' : 'Em andamento - Clique para selecionar'}
          >
            {isSelected ? (
              <CheckCircle2 className="w-5 h-5 fill-current" />
            ) : project.isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          
          <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors break-normal line-clamp-2 overflow-hidden w-full">
            {project.name || 'Projeto sem nome'}
          </h3>
          {/* Indicação de README no canto superior direito (visível em grid) */}
          {/* Removed top-right README icon for grid to avoid duplication with group badge */}
        </div>

        {/* Nome do autor/owner */}
        {project.owner && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">por</span>
            <a
              href={`https://github.com/${project.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline"
            >
              @{project.owner}
            </a>
          </div>
        )}

        {/* Linha divisória após título */}
        <div className="border-t border-dark-border mb-4"></div>

        {/* Descrição (área reservada para tamanho uniforme) */}
        <div className="mb-4 h-[140px] overflow-hidden">
          {project.description && (
            <p className="text-gray-400 text-sm whitespace-pre-line break-normal">
              {project.description}
            </p>
          )}
        </div>

        {/* Linha divisória após descrição */}
        <div className="border-t border-dark-border mb-4"></div>

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
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/30">
                📋 {project.group.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>

              {/* Mostrar ícone de README ao lado do grupo somente no modo grade */}
              {viewMode === 'grid' && (
                <span
                  title={hasReadme ? 'README disponível' : 'Sem README'}
                  className={`inline-block px-2.5 py-1 text-xs rounded-full border ${
                    hasReadme ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-800/30 text-gray-400 border-gray-700/30'
                  }`}
                >
                  {hasReadme ? (
                    <>
                      <FileText className="inline w-3.5 h-3.5 mr-1 align-middle" />
                      README disponível
                    </>
                  ) : (
                    <>
                      <AlertCircle className="inline w-3.5 h-3.5 mr-1 align-middle" />
                      Sem README
                    </>
                  )}
                </span>
              )}
            </div>
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

        {/* Linha divisória após stack/complexidade */}
        <div className="border-t border-dark-border mb-4"></div>

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
      </div>

      {/* Ações (Rodapé) */}
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
