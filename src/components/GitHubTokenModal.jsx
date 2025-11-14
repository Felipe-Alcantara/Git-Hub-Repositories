import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, AlertCircle, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { getGitHubToken, setGitHubToken } from '../utils/github';
import { loadGeminiApiKey, saveGeminiApiKey, verifyGeminiApiKey } from '../utils/gemini';

export default function GitHubTokenModal({ isOpen, onClose }) {
  const [token, setToken] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [verifyingGemini, setVerifyingGemini] = useState(false);
  const [geminiVerified, setGeminiVerified] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Pequeno delay para garantir que o componente seja renderizado antes da animação
      const timer = setTimeout(() => setShouldAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
      // Delay para permitir animação de saída antes de remover do DOM
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const currentToken = getGitHubToken();
      const currentGeminiKey = loadGeminiApiKey();
      setToken(currentToken || '');
      setGeminiKey(currentGeminiKey || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    setGitHubToken(token.trim());
    saveGeminiApiKey(geminiKey.trim());
    onClose();
  };

  const handleRemove = () => {
    setGitHubToken(null);
    setToken('');
  };

  const handleRemoveGemini = () => {
    saveGeminiApiKey(null);
    setGeminiKey('');
    setGeminiVerified(null);
  };

  const handleVerifyGemini = async () => {
    if (!geminiKey.trim()) {
      setGeminiVerified(false);
      return;
    }

    setVerifyingGemini(true);
    setGeminiVerified(null);

    try {
      const isValid = await verifyGeminiApiKey(geminiKey.trim());
      setGeminiVerified(isValid);
    } catch (error) {
      setGeminiVerified(false);
    } finally {
      setVerifyingGemini(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-all duration-500 ease-out ${
      shouldAnimate ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-dark-surface border border-dark-border rounded-lg w-full max-w-[96vw] max-h-[95vh] overflow-y-auto transform transition-all duration-500 ease-out ${
        shouldAnimate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Tokens de API - GitHub & IA</h2>
              <p className="text-sm text-gray-400 mt-1">Configure acesso ao GitHub e habilite explicações com IA</p>
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
        <div className="p-6">
          {/* Grid responsivo: 1 coluna em mobile, 2 colunas em md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seção GitHub Token */}
            <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">GitHub API Token</h3>
            </div>

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

            {/* Seção Google Gemini */}
            <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Google Gemini API Key</h3>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                IA para explicar projetos
              </span>
            </div>

            {/* Informações sobre Gemini */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong className="text-white">Google Gemini - IA Gratuita:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Explica automaticamente o que cada projeto faz</li>
                    <li>Analisa README, tecnologias e código</li>
                    <li><strong>Gratuito:</strong> 60 requisições por minuto</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Como criar API key do Gemini */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Como obter sua API key:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 ml-2">
                <li>
                  Acesse o Google AI Studio
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 text-purple-400 hover:text-purple-300"
                  >
                    Criar API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Clique em "Create API Key"</li>
                <li>Copie a chave gerada</li>
                <li>Cole no campo abaixo</li>
              </ol>
            </div>

            {/* Input da API key do Gemini */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza...xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  {showGeminiKey ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {/* Botão de verificação e status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyGemini}
                  disabled={verifyingGemini || !geminiKey.trim()}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                >
                  {verifyingGemini ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Key className="w-3 h-3" />
                      Verificar API Key
                    </>
                  )}
                </button>

                {geminiVerified === true && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    API Key válida
                  </div>
                )}

                {geminiVerified === false && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    API Key inválida
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                A chave é armazenada apenas no seu navegador (localStorage)
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-border flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm"
              disabled={!getGitHubToken()}
            >
              Remover GitHub Token
            </button>
            <button
              onClick={handleRemoveGemini}
              className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors text-sm"
              disabled={!loadGeminiApiKey()}
            >
              Remover Gemini Key
            </button>
          </div>
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
