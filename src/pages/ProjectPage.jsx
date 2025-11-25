import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, Download, Globe, Calendar, Code2, Lightbulb, Wrench, Bug, Target, Users, Rocket, Layers, TrendingUp, Edit2, CheckCircle2, Eye, Edit3, Pencil, FolderTree, FileText, Upload, Sparkles, Copy, Check } from 'lucide-react';
import { getProjectById, updateProject } from '../utils/storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import ModalShell from '../components/ModalShell';
import remarkGfm from 'remark-gfm';
import DrawingCanvas from '../components/DrawingCanvas';
import ProjectStructureTree from '../components/ProjectStructureTree';
import { parseGitHubUrl, getGitHubToken } from '../utils/github';
import AIExplanationPanel from '../components/AIExplanationPanel';

const sections = [
  { key: 'readme', label: 'README', icon: FileText, placeholder: 'Cole ou carregue o README.md do projeto aqui...', hasFileUpload: true },
  { key: 'ideas', label: 'Ideias', icon: Lightbulb, placeholder: 'Anote suas ideias para o projeto...' },
  { key: 'improvements', label: 'Melhorias', icon: Wrench, placeholder: 'Melhorias planejadas ou em andamento...' },
  { key: 'problems', label: 'Problemas', icon: Bug, placeholder: 'Problemas conhecidos e soluções...' },
  { key: 'purpose', label: 'Propósito', icon: Target, placeholder: 'Qual é o objetivo deste projeto?' },
  { key: 'users', label: 'Usuários', icon: Users, placeholder: 'Quem são os usuários-alvo?' },
  { key: 'mvp', label: 'MVP', icon: Rocket, placeholder: 'Defina o produto mínimo viável...' },
  { key: 'stack', label: 'Stack Técnica', icon: Layers, placeholder: 'Tecnologias e ferramentas utilizadas...' },
  { key: 'upgrades', label: 'Upgrades', icon: TrendingUp, placeholder: 'Próximas atualizações e features...' },
  { key: 'structure', label: 'Estrutura do Projeto', icon: FolderTree, placeholder: 'Organize a estrutura de pastas e arquivos...', isTreeView: true },
  { key: 'sketches', label: 'Desenhos/Sketches', icon: Pencil, placeholder: 'Use o canvas para desenhar diagramas e esboços...', isCanvas: true },
];

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [activeSection, setActiveSection] = useState('readme');
  const [viewMode, setViewMode] = useState('preview'); // 'edit' ou 'preview'
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Carrega a largura salva ou usa 320px como padrão
    const saved = localStorage.getItem('projectPageSidebarWidth');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [editedLinks, setEditedLinks] = useState({
    repoUrl: '',
    webUrl: '',
    downloadUrl: ''
  });
  const [showAIModal, setShowAIModal] = useState(() => {
    const saved = localStorage.getItem('projectPageShowAIModal');
    return saved ? JSON.parse(saved) : false;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('projectPageRightWidth');
    return saved ? parseInt(saved, 10) : 420;
  });
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [aiGenerateRequest, setAiGenerateRequest] = useState(null);

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
    console.log('[ProjectPage] handleDetailChange chamado:', {
      key,
      valueSize: value?.length || 0,
      projectId: editedProject?.id
    });
    
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

  const handleMouseDownRight = (e) => {
    setIsResizingRight(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      // Limita apenas o mínimo para evitar bugs
      if (newWidth >= 200) {
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

  // Right sidebar resize handling
  useEffect(() => {
    const handleMouseMoveRight = (e) => {
      if (!isResizingRight) return;
      // Calcular largura a partir da direita
      const newWidth = Math.max(320, window.innerWidth - e.clientX);
      setRightSidebarWidth(newWidth);
    };

    const handleMouseUpRight = () => {
      setIsResizingRight(false);
    };

    if (isResizingRight) {
      document.addEventListener('mousemove', handleMouseMoveRight);
      document.addEventListener('mouseup', handleMouseUpRight);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRight);
      document.removeEventListener('mouseup', handleMouseUpRight);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingRight]);

  // Salva a largura da sidebar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('projectPageSidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Salva a largura do painel direito
  useEffect(() => {
    localStorage.setItem('projectPageRightWidth', rightSidebarWidth.toString());
  }, [rightSidebarWidth]);

  const copyCodeSimple = async (text, id) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text || '');
      } else {
        const ta = document.createElement('textarea');
        ta.value = text || '';
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar código:', err);
    }
  };

  // Salva o estado do painel AI
  useEffect(() => {
    localStorage.setItem('projectPageShowAIModal', JSON.stringify(showAIModal));
  }, [showAIModal]);

  // Salva automaticamente os detalhes (incluindo sketches) após mudanças
  useEffect(() => {
    if (!editedProject || !project) {
      console.log('[ProjectPage] Salvamento automático: projeto não carregado');
      return;
    }
    
    // Verifica se o editedProject pertence ao projeto atual (pelo id)
    if (editedProject.id !== id) {
      console.log('[ProjectPage] Salvamento automático: ID não corresponde', {
        editedId: editedProject.id,
        currentId: id
      });
      return;
    }
    
    // Evita salvar na primeira renderização
    if (JSON.stringify(editedProject.details) === JSON.stringify(project.details)) {
      console.log('[ProjectPage] Salvamento automático: sem mudanças');
      return;
    }

    console.log('[ProjectPage] Salvamento automático agendado para 1 segundo', {
      projectId: id,
      projectName: editedProject.name
    });

    // Debounce: salva após 1 segundo sem mudanças
    const timeoutId = setTimeout(() => {
      console.log('[ProjectPage] Salvando automaticamente...', {
        projectId: id,
        projectName: editedProject.name,
        sketchesSize: editedProject.details.sketches?.length || 0
      });
      updateProject(id, editedProject);
      setProject(editedProject);
      console.log('[ProjectPage] ✅ Projeto salvo com sucesso!');
    }, 1000);

    return () => {
      console.log('[ProjectPage] Salvamento automático cancelado (cleanup)');
      clearTimeout(timeoutId);
    };
  }, [editedProject?.details, id, editedProject?.id, project]);

  // Preservar posição do scroll
  useEffect(() => {
    // Pequeno delay para garantir que o conteúdo seja renderizado
    const timeoutId = setTimeout(() => {
      const savedScroll = localStorage.getItem('projectPageScrollPosition');
      if (savedScroll) {
        const scrollPosition = parseInt(savedScroll, 10);
        if (scrollPosition > 0) {
          window.scrollTo({ top: scrollPosition, behavior: 'instant' });
        }
      }
    }, 100);

    const handleScroll = () => {
      localStorage.setItem('projectPageScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleCompleted = () => {
    const updated = { ...editedProject, isCompleted: !editedProject.isCompleted };
    setEditedProject(updated);
    updateProject(id, updated);
    setProject(updated);
  };

  const openEditLinks = () => {
    setEditedLinks({
      repoUrl: project.repoUrl || '',
      webUrl: project.webUrl || '',
      downloadUrl: project.downloadUrl || ''
    });
    setIsEditingLinks(true);
  };

  const saveLinks = () => {
    const updated = {
      ...editedProject,
      repoUrl: editedLinks.repoUrl.trim(),
      webUrl: editedLinks.webUrl.trim(),
      downloadUrl: editedLinks.downloadUrl.trim()
    };
    setEditedProject(updated);
    updateProject(id, updated);
    setProject(updated);
    setIsEditingLinks(false);
  };

  const cancelEditLinks = () => {
    setIsEditingLinks(false);
    setEditedLinks({
      repoUrl: '',
      webUrl: '',
      downloadUrl: ''
    });
  };

  const handleFileUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verifica se é um arquivo de texto
    if (!file.type.startsWith('text/') && !file.name.endsWith('.md')) {
      alert('Por favor, selecione um arquivo de texto (.txt, .md, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      handleDetailChange(key, content);
    };
    reader.onerror = () => {
      alert('Erro ao ler o arquivo. Tente novamente.');
    };
    reader.readAsText(file);
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
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                title="Explicar projeto com IA"
              >
                <Sparkles className="w-4 h-4" />
                Explicar com IA
              </button>

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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Links</h2>
                <button
                  onClick={openEditLinks}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                  title="Editar links"
                >
                  <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                </button>
              </div>
              
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
                  
                  // Se for a seção de desenhos, renderizar o canvas
                  if (section.isCanvas) {
                    return (
                      <div key={section.key} className="h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon className="w-6 h-6 text-blue-400" />
                          <h3 className="text-xl font-semibold text-white">{section.label}</h3>
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <DrawingCanvas
                            initialData={editedProject.details[section.key]}
                            onSave={(data) => handleDetailChange(section.key, data)}
                          />
                        </div>
                      </div>
                    );
                  }
                  
                  // Se for a seção de estrutura, renderizar o tree view
                  if (section.isTreeView) {
                    return (
                      <div key={section.key} className="h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon className="w-6 h-6 text-blue-400" />
                          <h3 className="text-xl font-semibold text-white">{section.label}</h3>
                          <span className="text-xs text-gray-500">Estilo VSCode Explorer</span>
                        </div>
                        
                        <div className="flex-1 overflow-hidden border border-dark-border rounded-lg">
                          <ProjectStructureTree
                            initialData={editedProject.details[section.key]}
                            onSave={(data) => handleDetailChange(section.key, data)}
                            {...(section.key === 'structure' ? {
                              repo: (() => {
                              const parsed = parseGitHubUrl(editedProject?.repoUrl || project?.repoUrl || '');
                              if (parsed) {
                                return { owner: parsed.owner, name: parsed.repo, branch: editedProject?.defaultBranch || undefined, token: getGitHubToken() };
                              }
                              // Fallback: usar o repositório atual se nenhum repoUrl estiver configurado
                              return { 
                                owner: 'Felipe-Alcantara', 
                                name: 'Git-Hub-Repositories', 
                                branch: 'main', 
                                token: getGitHubToken() 
                              };
                            })()
                            } : {})}
                          />
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={section.key} className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 text-blue-400" />
                          <h3 className="text-xl font-semibold text-white">{section.label}</h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Botão de upload de arquivo (apenas para seções com hasFileUpload) */}
                          {section.hasFileUpload && viewMode === 'edit' && (
                            <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors cursor-pointer">
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">Carregar arquivo</span>
                              <input
                                type="file"
                                accept=".md,.txt,text/*"
                                onChange={(e) => handleFileUpload(e, section.key)}
                                className="hidden"
                              />
                            </label>
                          )}
                          
                          {/* Toggle entre modo edição e visualização */}
                          <button
                            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-dark-surface border border-dark-border rounded-lg text-gray-300 hover:text-white hover:border-blue-500 transition-colors"
                            title={viewMode === 'edit' ? 'Visualizar Markdown' : 'Editar'}
                          >
                            {viewMode === 'edit' ? (
                              <>
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">Visualizar</span>
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-4 h-4" />
                                <span className="text-sm">Editar</span>
                              </>
                            )}
                          </button>
                          {/* Botão Gerar por IA: chama o painel de IA e solicita geração para a aba atual */}
                          <button
                            onClick={() => {
                              // Garante que a aba esteja ativa
                              setActiveSection(section.key);
                              setShowAIModal(true);
                              setAiGenerateRequest(section.key);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                            title={`Gerar conteúdo por IA para a aba ${section.label}`}
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm">Gerar por IA</span>
                          </button>
                        </div>
                      </div>
                      
                      {viewMode === 'edit' ? (
                        <textarea
                          value={editedProject.details[section.key] || ''}
                          onChange={(e) => handleDetailChange(section.key, e.target.value)}
                          placeholder={section.placeholder}
                          className="w-full flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm"
                        />
                      ) : (
                        <div className="w-full flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg overflow-y-auto">
                          {editedProject.details[section.key] ? (
                            <div className="markdown-preview text-gray-300">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4" {...props} />,
                                  h4: ({node, ...props}) => <h4 className="text-base font-semibold text-white mb-2 mt-3" {...props} />,
                                  p: ({node, children, ...props}) => {
                                    // Evita <p> envolvendo blocos de código (<pre>), o que causa warnings de DOM nesting
                                    const childArray = React.Children.toArray(children);
                                    if (childArray.some(c => c?.type === 'pre')) {
                                      // retorna apenas os filhos sem o <p>
                                      return <>{children}</>;
                                    }
                                    return <p className="text-gray-300 mb-3 leading-relaxed" {...props} />;
                                  },
                                  a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 text-gray-300 space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 text-gray-300 space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                                  code: ({ node, inline, className, children, ...props }) => {
                                    const langMatch = /language-(\w+)/.exec(className || '');
                                    const lang = langMatch ? langMatch[1] : null;
                                    const langMap = { js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX', py: 'Python', json: 'JSON' };
                                    const prettyLang = lang ? (langMap[lang] || lang.toUpperCase()) : null;

                                    if (inline) {
                                      return <code className="bg-dark-surface text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />;
                                    }

                                    return (
                                      <div className="relative my-3">
                                        {prettyLang && (() => {
                                              const codeText = Array.isArray(children) ? children.join('') : String(children);
                                              const codeId = `preview-${codeText.slice(0,40)}`;
                                              return (
                                                <div className="absolute -top-3 right-0 bg-dark-surface border border-dark-border rounded-t px-2 py-1 text-xs text-gray-300 flex items-center gap-2">
                                                  <span>{prettyLang}</span>
                                                  <button
                                                    onClick={() => copyCodeSimple(codeText, codeId)}
                                                    className="p-1 rounded hover:bg-dark-border"
                                                    title="Copiar código"
                                                  >
                                                    {copiedCodeId === codeId ? (
                                                      <Check className="w-3 h-3 text-green-400" />
                                                    ) : (
                                                      <Copy className="w-3 h-3 text-gray-300" />
                                                    )}
                                                  </button>
                                                </div>
                                              );
                                            })()}
                                        <pre className="block bg-dark-surface text-gray-300 p-3 rounded border border-dark-border overflow-x-auto font-mono text-sm">
                                          <code className={className} {...props}>{children}</code>
                                        </pre>
                                      </div>
                                    );
                                  },
                                  pre: ({node, ...props}) => <pre className="mb-3 overflow-x-auto" {...props} />,
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-3" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                  em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                                  hr: ({node, ...props}) => <hr className="border-dark-border my-4" {...props} />,
                                  table: ({node, ...props}) => <table className="border-collapse border border-dark-border my-3 w-full" {...props} />,
                                  thead: ({node, ...props}) => <thead className="bg-dark-surface" {...props} />,
                                  th: ({node, ...props}) => <th className="border border-dark-border px-3 py-2 text-left text-white font-semibold" {...props} />,
                                  td: ({node, ...props}) => <td className="border border-dark-border px-3 py-2 text-gray-300" {...props} />,
                                }}
                              >
                                {editedProject.details[section.key]}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">{section.placeholder}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Painel direito de explicação com IA (redimensionável) */}
        {showAIModal && (
          <aside
            className="flex-shrink-0 border-l border-dark-border bg-dark-surface overflow-y-auto relative"
            style={{ width: `${rightSidebarWidth}px` }}
          >
            <div
              onMouseDown={handleMouseDownRight}
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
              style={{ transform: 'translateX(-50%)' }}
            />
            <AIExplanationPanel
              visible={showAIModal}
              onClose={() => setShowAIModal(false)}
              project={editedProject || project}
              activeSection={activeSection}
              generateSectionRequest={aiGenerateRequest}
              onGenerateHandled={() => setAiGenerateRequest(null)}
            />
          </aside>
        )}
      </div>

      {/* Modal de edição de links */}
      {isEditingLinks && (
        <ModalShell isOpen={isEditingLinks} onClose={() => setIsEditingLinks(false)} overlayClassName="bg-black/50">
          <div className="bg-dark-surface border border-dark-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Editar Links</h3>
            
            <div className="space-y-4">
              {/* Link do Repositório */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  URL do Repositório
                </label>
                <input
                  type="url"
                  value={editedLinks.repoUrl}
                  onChange={(e) => setEditedLinks({ ...editedLinks, repoUrl: e.target.value })}
                  placeholder="https://github.com/usuario/repositorio"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Link do Site/Demo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  URL do Site/Demo
                </label>
                <input
                  type="url"
                  value={editedLinks.webUrl}
                  onChange={(e) => setEditedLinks({ ...editedLinks, webUrl: e.target.value })}
                  placeholder="https://meusite.com"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Link de Download */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Download className="w-4 h-4 inline mr-2" />
                  URL de Download
                </label>
                <input
                  type="url"
                  value={editedLinks.downloadUrl}
                  onChange={(e) => setEditedLinks({ ...editedLinks, downloadUrl: e.target.value })}
                  placeholder="https://example.com/download"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={cancelEditLinks}
                className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveLinks}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Links
              </button>
            </div>
          </div>
        </ModalShell>
      )}
      
      {/* Painel de explicação movido para o painel direito (redimensionável) */}
    </div>
  );
}
