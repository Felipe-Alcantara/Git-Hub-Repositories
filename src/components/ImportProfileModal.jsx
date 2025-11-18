import { useState } from 'react';
import ModalShell from './ModalShell';
import { X, Github, Loader2 } from 'lucide-react';
import { fetchUserRepositories, fetchGitHubLanguages, fetchGitHubReadme } from '../utils/github';
import { getProjects } from '../utils/storage';

export default function ImportProfileModal({ isOpen, onClose, onImport, onOpenToken }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimit, setRateLimit] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);

  // Extrai o nome de usuário de uma URL do GitHub ou retorna o nome diretamente
  const extractUsername = (input) => {
    const trimmed = input.trim();
    
    // Se for uma URL do GitHub
    if (trimmed.includes('github.com/')) {
      const match = trimmed.match(/github\.com\/([^\/\?#]+)/);
      return match ? match[1] : trimmed;
    }
    
    // Se for apenas o nome de usuário
    return trimmed;
  };

  const handleSearch = async () => {
    if (!username.trim()) {
      setError('Digite um nome de usuário ou URL do perfil do GitHub');
      return;
    }

    setLoading(true);
    setError('');
    setRepositories([]);
    setSelectedRepos([]);

    try {
      const extractedUsername = extractUsername(username);
      const repos = await fetchUserRepositories(extractedUsername);
      
      if (repos.length === 0) {
        setError('Nenhum repositório público encontrado');
        return;
      }

      setRepositories(repos);
      // Seleciona todos por padrão
      setSelectedRepos(repos.map((_, idx) => idx));
    } catch (err) {
      // If rate-limited, show a clearer message and provide easy access to token settings
      setError(err.message);
      if (err.rateLimitInfo) setRateLimit(err.rateLimitInfo);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSelected = async () => {
    setLoading(true);
    setError('');

    try {
      const existingProjects = getProjects();
      const existingUrls = new Set(existingProjects.map(p => p.repoUrl));
      
      const reposToImport = selectedRepos.map(idx => repositories[idx]);
      
      let importedCount = 0;
      let skippedCount = 0;
      const skippedRepos = [];
      
      // Importa cada repositório selecionado
      for (const repo of reposToImport) {
        // Verifica se já existe
        if (existingUrls.has(repo.repoUrl)) {
          skippedCount++;
          skippedRepos.push(repo.name);
          console.log(`⚠️ Repositório já existe, pulando: ${repo.name}`);
          continue;
        }
        
        const extractedUsername = extractUsername(username);
        
        // Busca linguagens do repositório
        let languagesData = {};
        try {
          languagesData = await fetchGitHubLanguages(extractedUsername, repo.name);
        } catch (err) {
          if (err.message && err.message.includes('Limite de requisições')) {
            setError(err.message);
            setLoading(false);
            return;
          }
          // caso contrário, segue com objecto vazia
          languagesData = {};
        }
        const languageNames = Object.keys(languagesData).sort((a, b) => languagesData[b] - languagesData[a]);
        
        // Se fetchGitHubLanguages lançar um erro de 403, propaga para exibir mensagem
        // (fetchGitHubLanguages agora joga erro quando 403)
        
        // Busca o README do repositório
        let readme = '';
        try {
          readme = await fetchGitHubReadme(extractedUsername, repo.name);
        } catch (err) {
          // Se houve erro 403 de rate limit, mostre mensagem para o usuário e aborta
          if (err.message && err.message.includes('Limite de requisições')) {
            setError(err.message);
            setRateLimit(err.rateLimitInfo || null);
            setLoading(false);
            return;
          }
          // Caso contrário, apenas continue com README vazio
          readme = '';
        }
        
        // Detecta GitHub Pages
        const pagesUrl = repo.homepage || `https://${extractedUsername}.github.io/${repo.name}/`;
        
        const projectData = {
          name: repo.name,
          description: repo.description,
          languages: languageNames,
          languagesData: languagesData, // Dados completos com bytes
          repoUrl: repo.repoUrl,
          webUrl: pagesUrl,
          downloadUrl: `${repo.repoUrl}/archive/refs/heads/${repo.defaultBranch}.zip`,
          repoCreatedAt: repo.createdAt,
          owner: extractedUsername, // Nome do autor/dono do repositório
          complexity: 'medium', // Pode ajustar baseado no tamanho
          isCompleted: false,
          group: 'backlog',
          // README vai dentro de details
          details: {
            readme: readme || '',
          },
        };

        console.log(`[ImportProfile] Importando ${repo.name} - README: ${readme?.length || 0} caracteres`);

        await onImport(projectData);
        importedCount++;
        
        // Adiciona à lista de URLs existentes para evitar duplicatas na mesma importação
        existingUrls.add(repo.repoUrl);
      }

      // Mostra mensagem de sucesso com estatísticas
      if (importedCount > 0) {
        const message = skippedCount > 0 
          ? `✅ ${importedCount} repositório(s) importado(s). ${skippedCount} já existente(s) foram ignorados: ${skippedRepos.join(', ')}`
          : `✅ ${importedCount} repositório(s) importado(s) com sucesso!`;
        
        // Poderia mostrar um toast aqui, mas vamos usar o error temporariamente para feedback
        if (skippedCount > 0) {
          setError(message);
          setTimeout(() => {
            handleClose();
          }, 3000);
        } else {
          handleClose();
        }
      } else {
        setError('⚠️ Todos os repositórios selecionados já foram importados anteriormente.');
      }
    } catch (err) {
      setError('Erro ao importar repositórios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRepo = (index) => {
    setSelectedRepos(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedRepos.length === repositories.length) {
      setSelectedRepos([]);
    } else {
      setSelectedRepos(repositories.map((_, idx) => idx));
    }
  };

  const openTokenModal = () => {
    if (typeof onOpenToken === 'function') onOpenToken();
  };

  const handleClose = () => {
    setUsername('');
    setRepositories([]);
    setSelectedRepos([]);
    setError('');
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose}>
      <div className="bg-dark-surface border border-dark-border rounded-lg w-[94vw] max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Github className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Importar Perfil do GitHub</h2>
              <p className="text-sm text-gray-400 mt-1">Importe todos os repositórios de um perfil</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

            {rateLimit && (
              <div className="text-xs text-gray-400 mt-2">Requisições restantes: {rateLimit.remaining ?? 'desconhecido'}</div>
            )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Busca de usuário */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome de usuário ou URL do perfil
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: Felipe-Alcantara ou https://github.com/Felipe-Alcantara"
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && repositories.length === 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-red-400 text-sm">{error}</p>
                    {rateLimit && (
                      <p className="text-gray-400 text-xs mt-1">Requisições restantes: {rateLimit.remaining ?? 'desconhecido'}</p>
                    )}
                    {error.includes('Limite de requisições') && (
                      <p className="text-gray-400 text-xs mt-1">Você atingiu o limite de requisições sem token. Configure um token para continuar.</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <button
                      onClick={openTokenModal}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
                    >
                      Configurar token
                    </button>
                    <button
                      onClick={() => setError('')}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded"
                    >
                      Fechar aviso
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista de repositórios */}
          {repositories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {repositories.length} repositório{repositories.length !== 1 ? 's' : ''} encontrado{repositories.length !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {selectedRepos.length === repositories.length ? 'Desselecionar todos' : 'Selecionar todos'}
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {repositories.map((repo, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRepos.includes(index)
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-dark-border hover:border-dark-hover'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.includes(index)}
                      onChange={() => toggleRepo(index)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-dark-bg border-dark-border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">{repo.name}</h4>
                        {repo.language && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>⭐ {repo.stars}</span>
                        <span>🍴 {repo.forks}</span>
                        <span>📅 {new Date(repo.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {repositories.length > 0 && (
          <div className="p-6 border-t border-dark-border flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {selectedRepos.length} repositório{selectedRepos.length !== 1 ? 's' : ''} selecionado{selectedRepos.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-dark-hover hover:bg-dark-border text-white rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleImportSelected}
                disabled={loading || selectedRepos.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `Importar ${selectedRepos.length}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
