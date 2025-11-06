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
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-40">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Informações básicas */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de informações */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Informações</h2>
              
              <div className="space-y-4">
                {/* Data de criação */}
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Criado em</span>
                  </div>
                  <p className="text-white ml-6">
                    {format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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

          {/* Área principal - Seções detalhadas */}
          <div className="lg:col-span-2">
            <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
              {/* Tabs de seções */}
              <div className="border-b border-dark-border overflow-x-auto">
                <div className="flex">
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
              <div className="p-6">
                {sections.map(section => {
                  if (activeSection !== section.key) return null;
                  
                  const Icon = section.icon;
                  return (
                    <div key={section.key}>
                      <div className="flex items-center gap-3 mb-4">
                        <Icon className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-semibold text-white">{section.label}</h3>
                      </div>
                      
                      <textarea
                        value={editedProject.details[section.key] || ''}
                        onChange={(e) => handleDetailChange(section.key, e.target.value)}
                        placeholder={section.placeholder}
                        rows={15}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
