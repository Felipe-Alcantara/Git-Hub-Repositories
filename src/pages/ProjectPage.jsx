import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, Download, Globe, Calendar, Code2, Lightbulb, Wrench, Bug, Target, Users, Rocket, Layers, TrendingUp, Edit2, CheckCircle2 } from 'lucide-react';
import { getProjectById, updateProject } from '../utils/storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sections = [
  { key: 'ideas', label: 'Ideias', icon: Lightbulb, placeholder: 'Anote suas ideias para o projeto...' },
  { key: 'improvements', label: 'Melhorias', icon: Wrench, placeholder: 'Melhorias planejadas ou em andamento...' },
  { key: 'problems', label: 'Problemas', icon: Bug, placeholder: 'Problemas conhecidos e soluções...' },
  { key: 'purpose', label: 'Propósito', icon: Target, placeholder: 'Qual é o objetivo deste projeto?' },
  { key: 'users', label: 'Usuários', icon: Users, placeholder: 'Quem são os usuários-alvo?' },
  { key: 'mvp', label: 'MVP', icon: Rocket, placeholder: 'Defina o produto mínimo viável...' },
  { key: 'stack', label: 'Stack Técnica', icon: Layers, placeholder: 'Tecnologias e ferramentas utilizadas...' },
  { key: 'upgrades', label: 'Upgrades', icon: TrendingUp, placeholder: 'Próximas atualizações e features...' },
];

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [activeSection, setActiveSection] = useState('ideas');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Carrega a largura salva ou usa 320px como padrão
    const saved = localStorage.getItem('projectPageSidebarWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const loadedProject = getProjectById(id);
    if (!loadedProject) {
      navigate('/');
      return;
    }
    setProject(loadedProject);
    setEditedProject({ ...loadedProject });
  }, [id, navigate]);

  const handleSave = () => {
    updateProject(id, editedProject);
    setProject(editedProject);
    setIsEditing(false);
  };

  const handleDetailChange = (key, value) => {
    setEditedProject(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: value,
      },
    }));
  };

  const handleBasicChange = (key, value) => {
    setEditedProject(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      // Limita a largura entre 250px e 600px
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Salva a largura da sidebar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('projectPageSidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  const toggleCompleted = () => {
    const updated = { ...editedProject, isCompleted: !editedProject.isCompleted };
    setEditedProject(updated);
    updateProject(id, updated);
    setProject(updated);
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  const totalLines = Object.values(project.linesOfCode || {}).reduce((sum, lines) => sum + lines, 0);

  return (
    <div className="h-screen bg-dark-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border z-50 w-full flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              
              {isEditing ? (
                <input
                  type="text"
                  value={editedProject.name}
                  onChange={(e) => handleBasicChange('name', e.target.value)}
                  className="text-2xl font-bold bg-dark-bg border border-dark-border rounded px-3 py-1 text-white"
                />
              ) : (
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleCompleted}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  project.isCompleted
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-dark-hover hover:bg-dark-border text-gray-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {project.isCompleted ? 'Finalizado' : 'Marcar como finalizado'}
              </button>

              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-hover hover:bg-dark-border text-gray-300 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar fixa à esquerda */}
        <aside 
          className="flex-shrink-0 border-r border-dark-border bg-dark-surface overflow-y-auto overflow-x-hidden relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="p-6 space-y-6">
            {/* Card de informações */}
            <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Informações</h2>
              
              <div className="space-y-4">
                {/* Data de criação */}
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Criado em</span>
                  </div>
                  <p className="text-white ml-6">
                    {format(new Date(project.repoCreatedAt || project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>

                {/* Linhas de código */}
                {totalLines > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Code2 className="w-4 h-4" />
                      <span className="text-sm">Linhas de código</span>
                    </div>
                    <p className="text-white ml-6">{totalLines.toLocaleString('pt-BR')}</p>
                  </div>
                )}

                {/* Complexidade */}
                <div>
                  <div className="text-gray-400 text-sm mb-2">Complexidade</div>
                  {isEditing ? (
                    <select
                      value={editedProject.complexity}
                      onChange={(e) => handleBasicChange('complexity', e.target.value)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white"
                    >
                      <option value="simple">Simples</option>
                      <option value="medium">Médio</option>
                      <option value="complex">Complexo</option>
                      <option value="unfeasible">Inviável</option>
                    </select>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full border border-blue-500/30">
                      {project.complexity === 'simple' ? 'Simples' : 
                       project.complexity === 'medium' ? 'Médio' :
                       project.complexity === 'complex' ? 'Complexo' : 'Inviável'}
                    </span>
                  )}
                </div>

                {/* Grupo Kanban */}
                <div>
                  <div className="text-gray-400 text-sm mb-2">Grupo Kanban</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProject.group || 'backlog'}
                      onChange={(e) => handleBasicChange('group', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white"
                      placeholder="backlog, in-progress, completed..."
                      list="group-suggestions-edit"
                    />
                  ) : (
                    <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full border border-green-500/30">
                      {(project.group || 'backlog').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  )}
                  <datalist id="group-suggestions-edit">
                    <option value="backlog" />
                    <option value="in-progress" />
                    <option value="completed" />
                    <option value="archived" />
                    <option value="on-hold" />
                    <option value="review" />
                  </datalist>
                </div>

                {/* Descrição */}
                <div>
                  <div className="text-gray-400 text-sm mb-2">Descrição</div>
                  {isEditing ? (
                    <textarea
                      value={editedProject.description}
                      onChange={(e) => handleBasicChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-white resize-none"
                    />
                  ) : (
                    <p className="text-white text-sm">{project.description || 'Sem descrição'}</p>
                  )}
                </div>

                {/* Linguagens */}
                {project.languages && project.languages.length > 0 && (
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Tecnologias</div>
                    <div className="flex flex-wrap gap-2">
                      {project.languages.map((lang, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/30"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estatísticas de Linguagens */}
                {project.languagesData && Object.keys(project.languagesData).length > 0 && (
                  <div className="mt-6">
                    <div className="text-gray-400 text-sm mb-3">Estatísticas de Código</div>
                    
                    {(() => {
                      const languages = project.languagesData;
                      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
                      const BYTES_PER_LINE = 60; // Estimativa: 1 linha ≈ 60 bytes
                      
                      // Cores para cada linguagem
                      const languageColors = {
                        'JavaScript': 'bg-yellow-400',
                        'TypeScript': 'bg-blue-500',
                        'Python': 'bg-blue-400',
                        'Java': 'bg-red-500',
                        'C++': 'bg-pink-500',
                        'C#': 'bg-purple-500',
                        'Ruby': 'bg-red-600',
                        'Go': 'bg-cyan-400',
                        'Rust': 'bg-orange-600',
                        'PHP': 'bg-indigo-400',
                        'HTML': 'bg-orange-500',
                        'CSS': 'bg-blue-400',
                        'SCSS': 'bg-pink-400',
                        'Shell': 'bg-green-500',
                        'Batchfile': 'bg-green-600',
                      };
                      
                      const sortedLanguages = Object.entries(languages)
                        .sort((a, b) => b[1] - a[1]);
                      
                      return (
                        <div className="space-y-3">
                          {/* Barra de progresso visual */}
                          <div className="flex h-3 rounded-full overflow-hidden bg-dark-border">
                            {sortedLanguages.map(([lang, bytes], idx) => {
                              const percentage = (bytes / totalBytes) * 100;
                              const color = languageColors[lang] || 'bg-gray-500';
                              return (
                                <div
                                  key={idx}
                                  className={`${color} transition-all hover:opacity-80`}
                                  style={{ width: `${percentage}%` }}
                                  title={`${lang}: ${percentage.toFixed(1)}%`}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Lista detalhada */}
                          <div className="space-y-2">
                            {sortedLanguages.map(([lang, bytes], idx) => {
                              const percentage = (bytes / totalBytes) * 100;
                              const estimatedLines = Math.round(bytes / BYTES_PER_LINE);
                              const color = languageColors[lang] || 'bg-gray-500';
                              
                              return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                    <span className="text-white font-medium">{lang}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-gray-400">
                                    <span>{percentage.toFixed(1)}%</span>
                                    <span>~{estimatedLines.toLocaleString('pt-BR')} linhas</span>
                                    <span className="text-xs">{(bytes / 1024).toFixed(1)} KB</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Total */}
                          <div className="pt-3 border-t border-dark-border flex items-center justify-between text-sm">
                            <span className="text-gray-400">Total</span>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-semibold">
                                ~{Math.round(totalBytes / BYTES_PER_LINE).toLocaleString('pt-BR')} linhas
                              </span>
                              <span className="text-gray-400 text-xs">
                                {(totalBytes / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Links</h2>
              
              <div className="space-y-3">
                {project.repoUrl && (
                  <a 
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-dark-hover hover:bg-dark-border rounded-lg transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                    <span className="text-white group-hover:text-blue-400">Repositório</span>
                  </a>
                )}
                
                {project.webUrl && (
                  <a 
                    href={project.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-dark-hover hover:bg-dark-border rounded-lg transition-colors group"
                  >
                    <Globe className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                    <span className="text-white group-hover:text-blue-400">Site/Demo</span>
                  </a>
                )}
                
                {project.downloadUrl && (
                  <a 
                    href={project.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-dark-hover hover:bg-dark-border rounded-lg transition-colors group"
                  >
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                    <span className="text-white group-hover:text-blue-400">Download</span>
                  </a>
                )}

                {!project.repoUrl && !project.webUrl && !project.downloadUrl && (
                  <p className="text-gray-400 text-sm">Nenhum link adicionado</p>
                )}
              </div>
            </div>
          </div>

          {/* Handle de resize */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group"
            style={{ transform: 'translateX(50%)' }}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        </aside>

        {/* Área principal - ocupa o resto da tela */}
        <main className="flex-1 overflow-x-hidden overflow-y-hidden flex flex-col">
          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden flex-1 flex flex-col">
              {/* Tabs de seções */}
              <div className="border-b border-dark-border">
                <div className="flex flex-wrap">
                  {sections.map(section => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.key}
                        onClick={() => setActiveSection(section.key)}
                        className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
                          activeSection === section.key
                            ? 'border-blue-500 text-blue-400 bg-dark-hover'
                            : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-dark-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conteúdo da seção ativa */}
              <div className="p-6 flex-1 overflow-hidden">
                {sections.map(section => {
                  if (activeSection !== section.key) return null;
                  
                  const Icon = section.icon;
                  return (
                    <div key={section.key} className="h-full flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <Icon className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-semibold text-white">{section.label}</h3>
                      </div>
                      
                      <textarea
                        value={editedProject.details[section.key] || ''}
                        onChange={(e) => handleDetailChange(section.key, e.target.value)}
                        placeholder={section.placeholder}
                        className="w-full flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
