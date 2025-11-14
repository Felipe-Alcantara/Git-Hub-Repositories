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
          <div className="text-sm text-gray-300">Gerando explicação... aguarde.</div>
        )}

        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}

        {!loading && !error && explanation && (
          <div className="prose prose-invert max-w-none text-sm">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        )}

        {!loading && !error && !explanation && (
          <div className="text-sm text-gray-400">Nenhuma explicação gerada ainda. Clique em "Gerar".</div>
        )}
      </div>
    </div>
  );
}
