import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2, Send, MessageCircle, Bot, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { explainProjectWithGemini, loadGeminiApiKey, askGeminiQuestion, flattenStructure, collectFilesPreview } from '../utils/gemini';
import ProjectStructureTree from './ProjectStructureTree';
import ModalShell from './ModalShell';
import { parseGitHubUrl, fetchGitHubFileContent, getGitHubToken } from '../utils/github';
import { updateProject } from '../utils/storage';

export default function AIExplanationPanel({ visible, onClose, project, activeSection }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`aiChat_${project?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectFilesModalOpen, setSelectFilesModalOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [loadingSelectedFiles, setLoadingSelectedFiles] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const copyToClipboard = async (text, id) => {
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
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
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

  // Busca arquivos da estrutura (do GitHub) e adiciona conteúdo à estrutura do projeto
  const loadFilesForAI = async () => {
    setError('');
    const parsed = parseGitHubUrl(project?.repoUrl || project?.webUrl || '');
    if (!parsed) {
      setError('URL do repositório não configurada ou inválida. Abra a aba Estrutura e configure o repositório.');
      return;
    }

    // Flatten structure e priorizar alguns arquivos
    const files = flattenStructure(project?.details?.structure || []);
    if (!files || files.length === 0) {
      setError('Estrutura do projeto vazia. Carregue a estrutura no painel antes de tentar baixar arquivos.');
      return;
    }

    setLoading(true);
    try {
      // Escolhe até 12 arquivos prioritários
      const toFetch = files.slice(0, 12);
      const fetched = await Promise.allSettled(toFetch.map(f => fetchGitHubFileContent(parsed.owner, parsed.repo, f.path)));

      // Atualiza a estrutura local com conteúdo lido
      const newStructure = JSON.parse(JSON.stringify(project.details.structure || []));

      const insertContent = (nodes) => {
        return nodes.map(n => {
          if (n.type === 'file') {
            const path = n.id; // o ID armazena caminho pelo ProjectStructureTree
            const idx = toFetch.findIndex(tf => tf.path === path || tf.name === n.name);
            if (idx !== -1 && fetched[idx]?.status === 'fulfilled') {
              n.content = fetched[idx].value || '';
            }
            return n;
          }
          if (n.children) return { ...n, children: insertContent(n.children) };
          return n;
        });
      };

      const updatedStructure = insertContent(newStructure);

      // Salva em localStorage para persistência e também atualizar contexto
      updateProject(project.id, { details: { ...project.details, structure: updatedStructure } });

      // Mensagem para o chat
      setMessages(prev => [...prev, { id: Date.now(), type: 'ai', content: `✅ ${toFetch.length} arquivos carregados para análise pela IA.` }]);
    } catch (err) {
      setError(err.message || 'Erro ao buscar arquivos');
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
      const result = await askGeminiQuestion(project, currentQuestion.trim(), messages, apiKey, activeSection);
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

      {/* Indicador da aba ativa */}
      {activeSection && (
        <div className="px-4 py-2 bg-dark-hover border-b border-dark-border">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Contexto: <span className="text-blue-400 font-medium">
              {activeSection === 'readme' && 'README'}
              {activeSection === 'ideas' && 'Ideias'}
              {activeSection === 'improvements' && 'Melhorias'}
              {activeSection === 'problems' && 'Problemas'}
              {activeSection === 'purpose' && 'Propósito'}
              {activeSection === 'users' && 'Usuários'}
              {activeSection === 'mvp' && 'MVP'}
              {activeSection === 'stack' && 'Stack Técnica'}
              {activeSection === 'upgrades' && 'Upgrades'}
              {activeSection === 'structure' && 'Estrutura do Projeto'}
              {activeSection === 'sketches' && 'Desenhos/Sketches'}
            </span></span>
          </div>
        </div>
      )}

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

            <div className="max-w-[80%]">
              {message.type === 'ai' ? (
                <div className="flex flex-col">
                  <div className="rounded-lg p-3 bg-dark-bg border border-dark-border text-gray-200">
                    <div className="prose prose-invert max-w-none text-sm prose-headings:text-white prose-headings:font-semibold prose-headings:border-b prose-headings:border-gray-600 prose-headings:pb-1 prose-headings:mb-3 prose-p:text-gray-200 prose-p:leading-relaxed prose-ul:text-gray-200 prose-li:marker:text-purple-400 prose-strong:text-white prose-strong:font-medium prose-code:text-purple-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                    <div>
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
                    </div>
                  </div>
                  <div className="mt-1 flex justify-start">
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="group flex items-center gap-2 px-2 py-1 rounded-full hover:bg-dark-surface transition-colors"
                      title="Copiar resposta"
                      aria-label="Copiar resposta"
                    >
                      <span className="p-1 rounded-full border border-dark-border bg-dark-surface flex items-center justify-center">
                        {copiedMessageId === message.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-300" />
                        )}
                      </span>
                      <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedMessageId === message.id ? 'Copiado' : 'Copiar'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-3 bg-purple-500/10 text-white border border-purple-500/30 text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
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
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectFilesModalOpen(true)}
                disabled={loading}
                className="px-3 py-1 bg-dark-surface border border-dark-border text-xs rounded hover:border-blue-500 transition-colors"
                title="Selecionar arquivos ou pastas específicos para carregar contexto"
              >
                Selecionar arquivos
              </button>
              <button
                onClick={loadFilesForAI}
                disabled={loading}
                className="px-3 py-1 bg-dark-surface border border-dark-border text-xs rounded hover:border-blue-500 transition-colors"
                title="Carregar arquivos do repositório para uso da IA"
              >
                Enviar contexto
              </button>
            </div>
            <button
              onClick={sendQuestion}
              disabled={loading || !currentQuestion.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Mensagem
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </div>
      </div>
      {/* Modal para selecionar arquivos/pastas da estrutura */}
      <ModalShell isOpen={selectFilesModalOpen} onClose={() => setSelectFilesModalOpen(false)}>
        <div className="bg-dark-surface border border-dark-border rounded-lg w-[94vw] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <h4 className="text-white font-semibold">Selecionar arquivos/pastas</h4>
            <button className="text-gray-400 hover:text-white" onClick={() => setSelectFilesModalOpen(false)}>Fechar</button>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <p className="text-sm text-gray-400 mb-3">Selecione arquivos ou pastas para enviar para a IA (apenas arquivos serão baixados do GitHub).</p>
            <ProjectStructureTree
              initialData={project?.details?.structure || []}
              onSave={() => {}}
              selectable={true}
              selectedIds={selectedFileIds}
              onSelectChange={(newSelected) => {
                // ProjectStructureTree passes the full array of selected IDs
                setSelectedFileIds(newSelected || []);
              }}
              repo={(function() {
                const parsed = parseGitHubUrl(project?.repoUrl || project?.webUrl || '');
                if (parsed) {
                  return { owner: parsed.owner, name: parsed.repo, branch: project?.defaultBranch || undefined, token: getGitHubToken() };
                }
                return null;
              })()}
            />
          </div>
          <div className="p-4 border-t border-dark-border flex items-center justify-between">
            <div className="text-xs text-gray-400">{selectedFileIds.length} arquivo(s) selecionado(s)</div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectFilesModalOpen(false)}
                className="px-3 py-2 bg-dark-hover hover:bg-dark-border text-white rounded"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  // Carregar conteúdo dos arquivos selecionados via API GitHub e atualizar estrutura
                  const parsed = parseGitHubUrl(project?.repoUrl || project?.webUrl || '');
                  if (!parsed) {
                    setError('Repositório inválido ou não configurado.');
                    return;
                  }

                  setLoadingSelectedFiles(true);
                  try {
                    // Expandir pastas: se algum ID selecionado for pasta, inclui todos os arquivos sob ela
                    const allFiles = flattenStructure(project?.details?.structure || []);
                    const selectedPaths = [];
                    // Helper: find node by id recursively
                    const findNodeById = (nodes, id) => {
                      for (const node of nodes) {
                        if (node.id === id) return node;
                        if (node.children) {
                          const found = findNodeById(node.children, id);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    for (const id of selectedFileIds) {
                      const isFolder = findNodeById(project?.details?.structure || [], id)?.type === 'folder';
                      if (isFolder) {
                        // incluir todos os arquivos que comecem com `${id}/`
                        allFiles.forEach(f => {
                          if (f.path.startsWith(`${id}/`)) selectedPaths.push(f.path);
                        });
                      } else {
                        // é um arquivo (path)
                        const match = allFiles.find(f => f.path === id);
                        if (match) selectedPaths.push(id);
                      }
                    }

                    const uniquePaths = [...new Set(selectedPaths)];

                    const fetched = await Promise.allSettled(
                      uniquePaths.map(path => fetchGitHubFileContent(parsed.owner, parsed.repo, path, project?.defaultBranch || 'HEAD'))
                    );

                    // Atualiza a estrutura com o conteúdo baixado
                    const newStructure = JSON.parse(JSON.stringify(project.details.structure || []));

                    const addContent = (nodes) => nodes.map(n => {
                      if (n.type === 'file' && uniquePaths.includes(n.id)) {
                        const idx = uniquePaths.indexOf(n.id);
                        const val = fetched[idx];
                        const content = val?.status === 'fulfilled' ? val.value : '';
                        return { ...n, content: content || n.content || '' };
                      }
                      if (n.children) return { ...n, children: addContent(n.children) };
                      return n;
                    });

                    const updated = addContent(newStructure);
                    updateProject(project.id, { details: { ...project.details, structure: updated } });

                    setMessages(prev => [...prev, { id: Date.now(), type: 'ai', content: `✅ ${selectedFileIds.length} arquivo(s) carregado(s) para análise.` }]);
                    setSelectFilesModalOpen(false);
                    setSelectedFileIds([]);
                  } catch (err) {
                    setError(err.message || 'Erro ao carregar arquivos selecionados');
                  } finally {
                    setLoadingSelectedFiles(false);
                  }
                }}
                disabled={selectedFileIds.length === 0 || loadingSelectedFiles}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSelectedFiles ? 'Carregando...' : 'Carregar selecionados'}
              </button>
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
