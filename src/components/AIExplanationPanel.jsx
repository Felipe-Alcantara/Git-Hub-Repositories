import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2, Send, MessageCircle, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { explainProjectWithGemini, loadGeminiApiKey, askGeminiQuestion } from '../utils/gemini';

export default function AIExplanationPanel({ visible, onClose, project }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`aiChat_${project?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Salva mensagens no localStorage quando mudam
  useEffect(() => {
    if (project?.id && messages.length > 0) {
      localStorage.setItem(`aiChat_${project.id}`, JSON.stringify(messages));
    }
  }, [messages, project?.id]);

  // Carrega mensagens salvas quando o projeto muda
  useEffect(() => {
    if (project?.id) {
      const saved = localStorage.getItem(`aiChat_${project.id}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([]);
      }
    }
  }, [project?.id]);

  const generateInitialExplanation = async () => {
    const apiKey = loadGeminiApiKey();
    if (!apiKey) {
      setError('⚙️ Configure a API Key do Google Gemini nas configurações primeiro.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await explainProjectWithGemini(project, apiKey);
      const newMessage = {
        id: Date.now(),
        type: 'ai',
        content: result,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      setError(err.message || 'Erro ao gerar explicação');
    } finally {
      setLoading(false);
    }
  };

  const sendQuestion = async () => {
    if (!currentQuestion.trim()) return;

    const apiKey = loadGeminiApiKey();
    if (!apiKey) {
      setError('⚙️ Configure a API Key do Google Gemini nas configurações primeiro.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuestion.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setLoading(true);
    setError('');

    try {
      const result = await askGeminiQuestion(project, currentQuestion.trim(), messages, apiKey);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || 'Erro ao enviar pergunta');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`aiChat_${project?.id}`);
  };

  if (!visible) return null;

  return (
    <div className="h-full flex flex-col bg-dark-surface border-l border-dark-border">
      <div className="p-4 flex items-center justify-between border-b border-dark-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Chat com IA</h3>
        </div>
        <div className="flex items-center gap-2">
          {messages.length === 0 && (
            <button
              onClick={generateInitialExplanation}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 text-purple-300 text-xs rounded hover:bg-purple-600/30 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Explicação
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-300 text-xs rounded hover:bg-red-600/30"
            >
              Limpar
            </button>
          )}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-purple-400 mb-4" />
            <h4 className="text-white font-medium mb-2">Chat com IA sobre o projeto</h4>
            <p className="text-gray-400 text-sm mb-4">
              Faça perguntas sobre este projeto ou gere uma explicação inicial
            </p>
            <button
              onClick={generateInitialExplanation}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Explicação Inicial
            </button>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-dark-bg border border-dark-border text-gray-200'
              }`}
            >
              {message.type === 'ai' ? (
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
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              )}
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-gray-300">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3 justify-center">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 max-w-[80%]">
              <div className="text-sm text-red-400">{error}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Campo de input */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex gap-2">
          <textarea
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre o projeto..."
            className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendQuestion}
            disabled={loading || !currentQuestion.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </div>
      </div>
    </div>
  );
}
