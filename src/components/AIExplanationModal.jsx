import { useState } from 'react';
import ModalShell from './ModalShell';
import { X, Sparkles, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { explainProjectWithGemini, loadGeminiApiKey } from '../utils/gemini';
import ReactMarkdown from 'react-markdown';

export default function AIExplanationModal({ isOpen, onClose, project }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExplain = async () => {
    const apiKey = loadGeminiApiKey();
    
    if (!apiKey) {
      setError('⚙️ Configure a API Key do Google Gemini nas configurações primeiro.');
      return;
    }

    setLoading(true);
    setError('');
    setExplanation('');

    try {
      const result = await explainProjectWithGemini(project, apiKey);
      setExplanation(result);
    } catch (err) {
      setError(err.message || 'Erro ao gerar explicação');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setExplanation('');
    setError('');
    onClose();
  };

  // Auto-explicar ao abrir o modal
  useState(() => {
    if (isOpen && !explanation && !loading && !error) {
      handleExplain();
    }
  }, [isOpen]);

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose}>
      <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Explicação com IA</h2>
              <p className="text-sm text-gray-400 mt-1">{project?.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Analisando projeto...</p>
                <p className="text-sm text-gray-400 mt-1">
                  A IA está lendo o README e analisando as tecnologias
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm">{error}</p>
                  {error.includes('Configure') && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Obter API Key do Google Gemini
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {explanation && (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  // Customizar renderização de elementos
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-6" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                  code: ({ node, inline, className, children, ...props }) => {
                    const langMatch = /language-(\w+)/.exec(className || '');
                    const lang = langMatch ? langMatch[1] : null;
                    const langMap = { js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX', py: 'Python', json: 'JSON' };
                    const prettyLang = lang ? (langMap[lang] || lang.toUpperCase()) : null;

                    if (inline) {
                      return <code className="bg-dark-bg px-2 py-0.5 rounded text-purple-400 text-sm font-mono" {...props} />;
                    }

                    return (
                      <div className="relative my-3">
                        {prettyLang && (
                          <div className="absolute -top-3 right-0 bg-dark-surface border border-dark-border rounded-t px-2 py-1 text-xs text-gray-300">
                            {prettyLang}
                          </div>
                        )}
                        <pre className="mb-3 overflow-x-auto bg-dark-bg border border-dark-border rounded-lg p-3 text-sm font-mono">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                  a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 underline" {...props} />,
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          )}

          {!loading && !error && !explanation && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Sparkles className="w-12 h-12 text-purple-400" />
              <div className="text-center">
                <p className="text-white font-medium">Pronto para explicar!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Clique em "Gerar Explicação" para começar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-border flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Powered by Google Gemini AI
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
            {(error || (!loading && !explanation)) && (
              <button
                onClick={handleExplain}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Gerando...' : error ? 'Tentar Novamente' : 'Gerar Explicação'}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
