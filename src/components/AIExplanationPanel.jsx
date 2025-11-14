import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { explainProjectWithGemini, loadGeminiApiKey } from '../utils/gemini';

export default function AIExplanationPanel({ visible, onClose, project }) {
  const [explanation, setExplanation] = useState(() => {
    const saved = localStorage.getItem(`aiExplanation_${project?.id}`);
    return saved || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    // Só gera automaticamente se não houver explicação salva e não estiver carregando
    if (!explanation && !loading && !error) {
      generateExplanation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Carrega explicação salva quando o projeto muda
  useEffect(() => {
    if (project?.id) {
      const saved = localStorage.getItem(`aiExplanation_${project.id}`);
      if (saved) {
        setExplanation(saved);
      } else {
        setExplanation('');
      }
    }
  }, [project?.id]);

  const generateExplanation = async () => {
    const apiKey = loadGeminiApiKey();
    if (!apiKey) {
      setError('⚙️ Configure a API Key do Google Gemini nas configurações primeiro.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await explainProjectWithGemini(project, apiKey);
      setExplanation(result);
      // Salva a explicação no localStorage
      localStorage.setItem(`aiExplanation_${project?.id}`, result);
    } catch (err) {
      setError(err.message || 'Erro ao gerar explicação');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-dark-surface border-l border-dark-border">
      <div className="p-4 flex items-center justify-between border-b border-dark-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Explicação com IA</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateExplanation}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 text-purple-300 text-xs rounded hover:bg-purple-600/30 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Gerar
          </button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-auto flex-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
            <div className="text-sm text-gray-300 mb-1">Analisando projeto...</div>
            <div className="text-xs text-gray-500">Isso pode levar alguns segundos</div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}

        {!loading && !error && explanation && (
          <div className="prose prose-invert max-w-none text-sm prose-headings:text-white prose-headings:font-semibold prose-headings:border-b prose-headings:border-gray-600 prose-headings:pb-1 prose-headings:mb-3 prose-p:text-gray-200 prose-p:leading-relaxed prose-ul:text-gray-200 prose-li:marker:text-purple-400 prose-strong:text-white prose-strong:font-medium prose-code:text-purple-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-white mt-4 mb-2 first:mt-0 flex items-center gap-2">
                    {children}
                  </h2>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1 ml-4 mb-3">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-200 leading-relaxed">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="text-white font-semibold">
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                )
              }}
            >
              {explanation}
            </ReactMarkdown>
          </div>
        )}

        {!loading && !error && !explanation && (
          <div className="text-sm text-gray-400">Nenhuma explicação gerada ainda. Clique em "Gerar".</div>
        )}
      </div>
    </div>
  );
}
