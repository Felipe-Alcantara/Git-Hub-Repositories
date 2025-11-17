import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { fetchCompleteGitHubInfo } from '../utils/github';
import { getProjects } from '../utils/storage';
import TagSelector from './TagSelector';

export default function NewProjectModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    languages: [],
    languagesData: {},
    repoUrl: '',
    downloadUrl: '',
    webUrl: '',
    complexity: 'simple',
    isCompleted: false,
    repoCreatedAt: null,
    owner: '',
    readme: '', // Conteúdo do README
    group: 'backlog',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Verifica se já existe um projeto com a mesma URL
    if (formData.repoUrl) {
      const existingProjects = getProjects();
      const duplicate = existingProjects.find(p => p.repoUrl === formData.repoUrl);
      
      if (duplicate) {
        setError(`⚠️ Este repositório já foi importado: "${duplicate.name}"`);
        return;
      }
    }
    
    const projectData = {
      ...formData,
      languages: formData.languages, // Já é array agora
      // Move o readme para dentro de details se existir
      details: {
        ...(formData.details || {}),
        readme: formData.readme || '',
      },
    };
    
    // Remove readme do nível raiz se existir
    delete projectData.readme;
    
    console.log('[NewProjectModal] Salvando projeto com README:', {
      name: projectData.name,
      hasReadme: !!projectData.details?.readme,
      readmeLength: projectData.details?.readme?.length || 0
    });
    
    onSave(projectData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      languages: [],
      languagesData: {},
      repoUrl: '',
      downloadUrl: '',
      webUrl: '',
      complexity: 'simple',
      isCompleted: false,
      repoCreatedAt: null,
      owner: '',
      readme: '',
      group: 'backlog',
    });
    setError('');
  };

  const handleFetchFromGitHub = async () => {
    if (!formData.repoUrl) {
      setError('Por favor, insira uma URL do GitHub');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const repoData = await fetchCompleteGitHubInfo(formData.repoUrl);
      
      // Converte linguagens de string para array
      const languagesArray = repoData.languages 
        ? repoData.languages.split(',').map(l => l.trim()).filter(Boolean)
        : [];
      
      setFormData(prev => ({
        ...prev,
        name: repoData.name || prev.name,
        description: repoData.description || prev.description,
        languages: languagesArray.length > 0 ? languagesArray : prev.languages,
        languagesData: repoData.languagesData || prev.languagesData, // Dados completos com bytes
        webUrl: repoData.webUrl || prev.webUrl,
        downloadUrl: repoData.downloadUrl || prev.downloadUrl,
        repoCreatedAt: repoData.repoCreatedAt || null, // Data de criação do repo
        owner: repoData.owner || prev.owner, // Nome do autor/dono do repositório
        readme: repoData.readme || prev.readme, // Conteúdo do README em markdown
      }));
      
      // Feedback visual sobre o README
      if (repoData.readme) {
        console.log('✅ README importado com sucesso!');
      } else {
        console.log('ℹ️ README não encontrado neste repositório');
      }
    } catch (err) {
      console.error('Erro ao buscar do GitHub:', err);
      setError(err.message || 'Erro ao buscar dados do GitHub');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border sticky top-0 bg-dark-surface">
          <h2 className="text-2xl font-bold text-white">Novo Projeto</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* GitHub URL com botão de busca */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL do Repositório GitHub
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.repoUrl}
                onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://github.com/usuario/repositorio"
              />
              <button
                type="button"
                onClick={handleFetchFromGitHub}
                disabled={loading || !formData.repoUrl}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            <p className="text-gray-500 text-sm mt-2">
              Cole a URL do repositório e clique em "Buscar" para preencher automaticamente
            </p>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Meu projeto incrível"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Uma breve descrição do projeto..."
            />
          </div>

          {/* Linguagens/Tecnologias */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Linguagens/Tecnologias
            </label>
            <TagSelector
              selectedTags={formData.languages}
              onChange={(tags) => setFormData({ ...formData, languages: tags })}
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL do Site/Demo
              </label>
              <input
                type="url"
                value={formData.webUrl}
                onChange={(e) => setFormData({ ...formData, webUrl: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://meusite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL de Download
              </label>
              <input
                type="url"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://releases.com/app.zip"
              />
            </div>
          </div>

          {/* Complexidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Complexidade
            </label>
            <select
              value={formData.complexity}
              onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="simple">Simples</option>
              <option value="medium">Médio</option>
              <option value="complex">Complexo</option>
              <option value="unfeasible">Inviável no momento</option>
            </select>
          </div>

          {/* Grupo Kanban */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Grupo Kanban
            </label>
            <input
              type="text"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="backlog, in-progress, completed..."
              list="group-suggestions"
            />
            <datalist id="group-suggestions">
              <option value="backlog" />
              <option value="in-progress" />
              <option value="completed" />
              <option value="archived" />
              <option value="on-hold" />
              <option value="review" />
            </datalist>
            <p className="mt-1 text-xs text-gray-500">
              O grupo define em qual coluna do Kanban o projeto aparecerá
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCompleted"
              checked={formData.isCompleted}
              onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
              className="w-4 h-4 rounded border-dark-border bg-dark-bg text-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isCompleted" className="text-sm text-gray-300">
              Projeto finalizado
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-dark-hover text-white rounded-lg hover:bg-dark-border transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
