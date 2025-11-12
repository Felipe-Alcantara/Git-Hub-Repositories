import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, AlertCircle } from 'lucide-react';
import { getGitHubToken, setGitHubToken } from '../utils/github';

export default function GitHubTokenModal({ isOpen, onClose }) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentToken = getGitHubToken();
      setToken(currentToken || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    setGitHubToken(token.trim());
    onClose();
  };

  const handleRemove = () => {
    setGitHubToken(null);
    setToken('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Token de API do GitHub</h2>
              <p className="text-sm text-gray-400 mt-1">Configure para aumentar o limite de requisições</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Informações sobre limites */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong className="text-white">Limites da API do GitHub:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Sem token:</strong> 60 requisições por hora</li>
                  <li><strong>Com token:</strong> 5000 requisições por hora</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Como criar um token */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Como criar um token:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 ml-2">
              <li>
                Acesse as configurações do GitHub
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-blue-400 hover:text-blue-300"
                >
                  Criar token
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Dê um nome ao token (ex: "GitHub Repositories Manager")</li>
              <li>Selecione a permissão: <code className="bg-dark-bg px-2 py-0.5 rounded text-blue-400">public_repo</code></li>
              <li>Clique em "Generate token" e copie o token gerado</li>
              <li>Cole o token no campo abaixo</li>
            </ol>
          </div>

          {/* Input do token */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Token de Acesso Pessoal
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                {showToken ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              O token é armazenado apenas no seu navegador (localStorage)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-border flex items-center justify-between">
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm"
            disabled={!getGitHubToken()}
          >
            Remover Token
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Salvar Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
