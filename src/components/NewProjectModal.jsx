import { useState } from 'react';
import { X } from 'lucide-react';

export default function NewProjectModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    languages: '',
    repoUrl: '',
    downloadUrl: '',
    webUrl: '',
    complexity: 'simple',
    isCompleted: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
    };
    
    onSave(projectData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      languages: '',
      repoUrl: '',
      downloadUrl: '',
      webUrl: '',
      complexity: 'simple',
      isCompleted: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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

          {/* Linguagens */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Linguagens/Tecnologias
            </label>
            <input
              type="text"
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="JavaScript, React, Node.js (separadas por vírgula)"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL do Repositório
              </label>
              <input
                type="url"
                value={formData.repoUrl}
                onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://github.com/user/repo"
              />
            </div>

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
