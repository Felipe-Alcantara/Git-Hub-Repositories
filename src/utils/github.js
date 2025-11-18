// Funções para integração com a API do GitHub

// Token do GitHub (opcional) - armazenado no localStorage
const GITHUB_TOKEN_KEY = 'github_api_token';

/**
 * Obtém o token do GitHub do localStorage
 * @returns {string|null} - Token ou null
 */
export function getGitHubToken() {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

/**
 * Define o token do GitHub no localStorage
 * @param {string} token - Token de acesso pessoal do GitHub
 */
export function setGitHubToken(token) {
  if (token) {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  }
}

/**
 * Cria headers para requisições à API do GitHub
 * @returns {Object} - Headers com ou sem autenticação
 */
function getGitHubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  return headers;
}

/**
 * Extrai owner e repo de uma URL do GitHub
 * @param {string} url - URL do repositório GitHub
 * @returns {Object|null} - { owner, repo } ou null se inválido
 */
export function parseGitHubUrl(url) {
  try {
    // Aceita vários formatos:
    // https://github.com/owner/repo
    // github.com/owner/repo
    // owner/repo
    
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/\?#]+)/i,
      /^([^\/]+)\/([^\/\?#]+)$/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''), // Remove .git se existir
        };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Busca informações do repositório na API do GitHub
 * @param {string} owner - Dono do repositório
 * @param {string} repo - Nome do repositório
 * @returns {Promise<Object>} - Dados do repositório
 */
export async function fetchGitHubRepo(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: getGitHubHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Limite de requisições atingido. Configure um token do GitHub nas configurações.');
      }
      throw new Error(`Erro ${response.status}: Repositório não encontrado`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: {
        name: data.name,
        description: data.description || '',
        language: data.language,
        languages: [], // Será preenchido depois
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        repoUrl: data.html_url,
        homepage: data.homepage || '',
        topics: data.topics || [],
        stars: data.stargazers_count,
        forks: data.forks_count,
        defaultBranch: data.default_branch,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Busca linguagens do repositório
 * @param {string} owner - Dono do repositório
 * @param {string} repo - Nome do repositório
 * @returns {Promise<Object>} - Objeto com linguagens e seus bytes
 */
export async function fetchGitHubLanguages(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: getGitHubHeaders()
    });
    
    if (!response.ok) {
      return {};
    }
    
    const data = await response.json();
    
    // Retorna o objeto completo com bytes por linguagem
    return data;
  } catch (error) {
    return {};
  }
}

/**
 * Busca apenas os nomes das linguagens ordenados por uso
 * @param {string} owner - Dono do repositório
 * @param {string} repo - Nome do repositório
 * @returns {Promise<Array>} - Lista de nomes de linguagens
 */
export async function fetchGitHubLanguageNames(owner, repo) {
  try {
    const data = await fetchGitHubLanguages(owner, repo);
    // Retorna linguagens ordenadas por uso (bytes)
    return Object.keys(data).sort((a, b) => data[b] - data[a]);
  } catch (error) {
    return [];
  }
}

/**
 * Busca informações completas do repositório
 * @param {string} url - URL do repositório GitHub
 * @returns {Promise<Object>} - Dados completos do repositório
 * @throws {Error} - Se houver erro na busca
 */
export async function fetchCompleteGitHubInfo(url) {
  const parsed = parseGitHubUrl(url);
  
  if (!parsed) {
    throw new Error('URL inválida do GitHub');
  }
  
  const { owner, repo } = parsed;
  
  // Busca informações do repo
  const repoInfo = await fetchGitHubRepo(owner, repo);
  
  if (!repoInfo.success) {
    throw new Error(repoInfo.error);
  }
  
  // Busca linguagens
  const languagesData = await fetchGitHubLanguages(owner, repo);
  const languageNames = Object.keys(languagesData).sort((a, b) => languagesData[b] - languagesData[a]);
  
  // Detecta GitHub Pages
  const pagesUrl = await detectGitHubPages(owner, repo);
  
  // Busca README
  const readme = await fetchGitHubReadme(owner, repo);
  
  console.log(`[GitHub] fetchCompleteGitHubInfo - README length: ${readme?.length || 0}`);
  
  return {
    name: repoInfo.data.name,
    description: repoInfo.data.description,
    languages: languageNames.join(', '),
    languagesData: languagesData, // Dados completos com bytes
    repoUrl: repoInfo.data.repoUrl,
    webUrl: repoInfo.data.homepage || pagesUrl || '',
    downloadUrl: `${repoInfo.data.repoUrl}/archive/refs/heads/${repoInfo.data.defaultBranch}.zip`,
    repoCreatedAt: repoInfo.data.createdAt, // Data de criação do repositório
    owner: owner, // Nome do autor/dono do repositório
    readme: readme, // Conteúdo do README em markdown
  };
}

/**
 * Busca o conteúdo do README de um repositório
 * @param {string} owner - Dono do repositório
 * @param {string} repo - Nome do repositório
 * @returns {Promise<string>} - Conteúdo do README em markdown ou string vazia
 */
export async function fetchGitHubReadme(owner, repo) {
  try {
    console.log(`[GitHub] Buscando README de ${owner}/${repo}...`);
    
    // A API do GitHub tem um endpoint específico para README
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          ...getGitHubHeaders(),
          'Accept': 'application/vnd.github.v3.raw', // Retorna o conteúdo raw
        }
      }
    );

    if (!response.ok) {
      // README não encontrado ou erro
      console.warn(`[GitHub] README não encontrado para ${owner}/${repo} - Status: ${response.status}`);
      return '';
    }

    const content = await response.text();
    console.log(`[GitHub] ✅ README carregado com sucesso: ${owner}/${repo} (${content.length} caracteres)`);
    return content;
  } catch (error) {
    console.error(`[GitHub] ❌ Erro ao buscar README de ${owner}/${repo}:`, error);
    return '';
  }
}

/**
 * Busca o conteúdo de um arquivo específico do repositório via API contents
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} branch
 * @returns {Promise<string>} conteúdo do arquivo ou string vazia
 */
export async function fetchGitHubFileContent(owner, repo, path, branch = 'HEAD') {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, {
      headers: getGitHubHeaders()
    });

    if (!res.ok) {
      console.warn(`[GitHub] Arquivo não encontrado: ${owner}/${repo}/${path} - Status: ${res.status}`);
      return '';
    }

    const data = await res.json();
    if (!data.content) return '';
    const decoded = atob(data.content.replace(/\n/g, ''));
    try {
      return decodeURIComponent(escape(decoded));
    } catch (e) {
      return decoded;
    }
  } catch (error) {
    console.error('[GitHub] Erro ao buscar arquivo do repo:', error);
    return '';
  }
}

/**
 * Busca todos os repositórios públicos de um usuário do GitHub
 * @param {string} username - Nome de usuário do GitHub
 * @returns {Promise<Array>} - Lista de repositórios
 */
export async function fetchUserRepositories(username) {
  try {
    const repos = [];
    let page = 1;
    let hasMore = true;

    // Busca paginada (até 100 repos por página)
    while (hasMore) {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: getGitHubHeaders()
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('❌ Token do GitHub inválido ou expirado. Configure um novo token nas configurações (⚙️).');
        }
        if (response.status === 403) {
          throw new Error('⏱️ Limite de requisições atingido. Configure um token do GitHub nas configurações (⚙️) para aumentar o limite.');
        }
        if (response.status === 404) {
          throw new Error(`❌ Usuário "${username}" não encontrado no GitHub.`);
        }
        throw new Error(`❌ Erro ${response.status}: Não foi possível buscar repositórios.`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        repos.push(...data);
        page++;
      }

      // Limita a 500 repos para não travar
      if (repos.length >= 500) {
        hasMore = false;
      }
    }

    return repos.map(repo => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language,
      repoUrl: repo.html_url,
      homepage: repo.homepage || '',
      topics: repo.topics || [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
    }));
  } catch (error) {
    throw new Error(error.message || 'Erro ao buscar repositórios do usuário');
  }
}

/**
 * Detecta se repositório tem GitHub Pages
 * @param {string} owner - Dono do repositório
 * @param {string} repo - Nome do repositório
 * @returns {Promise<string|null>} - URL do GitHub Pages ou null
 */
export async function detectGitHubPages(owner, repo) {
  try {
    // Tenta acessar GitHub Pages
    const possibleUrls = [
      `https://${owner}.github.io/${repo}/`,
      `https://${owner}.github.io/`,
    ];
    
    for (const url of possibleUrls) {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // Se não der erro, provavelmente existe
      return url;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
