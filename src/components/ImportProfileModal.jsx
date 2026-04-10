import { useState } from 'react';
import ModalShell from './ModalShell';
import { X, Github, Loader2 } from 'lucide-react';
import { fetchUserRepositories, fetchGitHubLanguages, fetchGitHubReadme } from '../utils/github';
import { getProjects } from '../utils/storage';

export default function ImportProfileModal({ isOpen, onClose, onImport, onOpenToken }) {
  // Aceita múltiplos perfis (um por linha). Ex: "Felipe-Alcantara\noutro-user" ou URLs completas.
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimit, setRateLimit] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [updatedRepos, setUpdatedRepos] = useState(new Set());

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

    console.debug('[ImportProfileModal] handleSearch - iniciando busca para:', username);
    setLoading(true);
    setError('');
    setRepositories([]);
    setSelectedRepos([]);
    setUpdatedRepos(new Set());

    try {
      // Permite múltiplos perfis - cada perfil em uma linha
      const lines = username.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setError('Digite um nome de usuário ou URL do perfil do GitHub');
        return;
      }

      const allRepos = [];
      const errors = [];

      // Busca projetos existentes para comparar datas
      const existingProjects = await getProjects();
      const existingReposMap = new Map(
        existingProjects
          .filter(p => p.repoUrl)
          .map(p => [p.repoUrl, p])
      );

      for (const line of lines) {
        const extractedUsername = extractUsername(line);
        try {
          console.debug('[ImportProfileModal] handleSearch - buscando repositórios para:', extractedUsername);
          const repos = await fetchUserRepositories(extractedUsername);
          if (repos.length > 0) {
            // marca o owner para cada repo para importar depois
            allRepos.push(...repos.map(r => ({ ...r, owner: extractedUsername })));
          } else {
            errors.push(`Nenhum repositório encontrado para ${extractedUsername}`);
          }
        } catch (err) {
          // registra o erro, mas continua com as outras importações
          errors.push(err.message || `Erro ao buscar ${extractedUsername}`);
          if (err.rateLimitInfo) setRateLimit(err.rateLimitInfo);
        }
      }

      if (allRepos.length === 0) {
        setError(errors.length > 0 ? errors.join('; ') : 'Nenhum repositório encontrado');
        return;
      }

      // Identifica repositórios que foram atualizados
      const updated = new Set();
      allRepos.forEach((repo, idx) => {
        const existing = existingReposMap.get(repo.repoUrl);
        if (existing) {
          const existingDate = new Date(existing.repoUpdatedAt || existing.updatedAt || 0);
          const newDate = new Date(repo.updatedAt);
          if (newDate > existingDate) {
            updated.add(idx);
            console.info('[ImportProfileModal] Repositório atualizado detectado:', repo.name, 
              'Existente:', existingDate.toISOString(), 'Novo:', newDate.toISOString());
          }
        }
      });

      console.info('[ImportProfileModal] handleSearch - total de repositórios encontrados:', allRepos.length);
      console.info('[ImportProfileModal] handleSearch - repositórios com atualizações:', updated.size);
      
      setRepositories(allRepos);
      setUpdatedRepos(updated);
      
      if (errors.length > 0) {
        setError(errors.join('; '));
      }
      
      // Seleciona apenas os novos e atualizados por padrão
      const toSelect = allRepos
        .map((repo, idx) => {
          const isNew = !existingReposMap.has(repo.repoUrl);
          const isUpdated = updated.has(idx);
          return (isNew || isUpdated) ? idx : null;
        })
        .filter(idx => idx !== null);
      
      setSelectedRepos(toSelect.length > 0 ? toSelect : allRepos.map((_, idx) => idx));
      
      if (updated.size > 0) {
        setError(`✨ ${updated.size} repositório(s) com atualizações detectadas!`);
      }
    } catch (err) {
      // If rate-limited, show a clearer message and provide easy access to token settings
      setError(err.message);
      if (err.rateLimitInfo) setRateLimit(err.rateLimitInfo);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSelected = async () => {
    console.debug('[ImportProfileModal] handleImportSelected - importando repositórios selecionados:', selectedRepos.length);
    setLoading(true);
    setError('');

    try {
      const existingProjects = await getProjects();
      const existingReposMap = new Map(
        existingProjects
          .filter(p => p.repoUrl)
          .map(p => [p.repoUrl, p])
      );
      
      const reposToImport = selectedRepos.map(idx => repositories[idx]);
      
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const skippedRepos = [];
      const updatedReposList = [];
      
      // Importa cada repositório selecionado
      for (const repo of reposToImport) {
        const existingProject = existingReposMap.get(repo.repoUrl);
        
        // Verifica se já existe e se foi atualizado
        if (existingProject) {
          const existingDate = new Date(existingProject.repoUpdatedAt || existingProject.updatedAt || 0);
          const newDate = new Date(repo.updatedAt);
          
          // Se não foi atualizado, pula
          if (newDate <= existingDate) {
            skippedCount++;
            skippedRepos.push(repo.name);
            console.debug('[ImportProfileModal] handleImportSelected - pulando repo sem atualizações:', repo.name);
            continue;
          }
          
          // Se foi atualizado, marca para atualizar
          console.info('[ImportProfileModal] handleImportSelected - atualizando repo:', repo.name);
          updatedReposList.push(repo.name);
        }
        
        const extractedUsername = repo.owner || extractUsername(username);
        
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
          repoUpdatedAt: repo.updatedAt, // Data de atualização do repositório
          owner: extractedUsername, // Nome do autor/dono do repositório
          complexity: existingProject?.complexity || 'medium',
          isCompleted: existingProject?.isCompleted || false,
          group: existingProject?.group || 'backlog',
          // README vai dentro de details, preserva outros detalhes se for atualização
          details: {
            ...(existingProject?.details || {}),
            readme: readme || existingProject?.details?.readme || '',
          },
        };

        console.info(`[ImportProfile] ${existingProject ? 'Atualizando' : 'Importando'} ${repo.name} - README: ${readme?.length || 0} caracteres`);

        console.debug('[ImportProfileModal] handleImportSelected - chamando onImport para repo:', repo.name);
        await onImport(projectData, existingProject?.id);
        
        if (existingProject) {
          updatedCount++;
        } else {
          importedCount++;
        }
        
        // Adiciona ao mapa para evitar duplicatas na mesma importação
        existingReposMap.set(repo.repoUrl, projectData);
      }

      // Mostra mensagem de sucesso com estatísticas
      const totalProcessed = importedCount + updatedCount;
      if (totalProcessed > 0) {
        const parts = [];
        if (importedCount > 0) parts.push(`${importedCount} novo(s)`);
        if (updatedCount > 0) parts.push(`${updatedCount} atualizado(s)`);
        if (skippedCount > 0) parts.push(`${skippedCount} sem alterações`);
        
        const message = `✅ ${parts.join(', ')}!`;
        
        if (updatedCount > 0) {
          setError(`${message}\n📝 Atualizados: ${updatedReposList.join(', ')}`);
          setTimeout(() => {
            handleClose();
          }, 4000);
        } else if (skippedCount > 0) {
          setError(message);
          setTimeout(() => {
            handleClose();
          }, 3000);
        } else {
          handleClose();
        }
      } else {
        console.warn('[ImportProfileModal] handleImportSelected - nenhum repositório processado');
        setError('⚠️ Todos os repositórios selecionados já estão atualizados.');
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
    setUpdatedRepos(new Set());
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
              <p className="text-sm text-gray-400 mt-1">Importe os repositórios de um ou mais perfis (um por linha)</p>
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
              Nome de usuário ou URL do perfil (um por linha para importar múltiplos)
            </label>
            <div className="flex gap-3">
              <textarea
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={"Ex: Felipe-Alcantara ou https://github.com/Felipe-Alcantara\nAdicione outro nome em outra linha para importar vários perfis"}
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                rows={3}
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
                        ? updatedRepos.has(index)
                          ? 'border-yellow-500 bg-yellow-500/5'
                          : 'border-blue-500 bg-blue-500/5'
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
                        <span className="text-xs text-gray-400">@{repo.owner}</span>
                        {updatedRepos.has(index) && (
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded border border-yellow-500/30 flex items-center gap-1">
                            ✨ Atualizado
                          </span>
                        )}
                        {repo.language && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/30">
                            {repo.language}
                          </span>
                        )}
                        {repo.private && (
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/30">
                            Privado
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
