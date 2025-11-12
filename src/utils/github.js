// Funções para integração com a API do GitHub

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
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (!response.ok) {
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
 * @returns {Promise<Array>} - Lista de linguagens
 */
export async function fetchGitHubLanguages(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
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
  const languages = await fetchGitHubLanguages(owner, repo);
  
  // Detecta GitHub Pages
  const pagesUrl = await detectGitHubPages(owner, repo);
  
  return {
    name: repoInfo.data.name,
    description: repoInfo.data.description,
    languages: languages.join(', '),
    repoUrl: repoInfo.data.repoUrl,
    webUrl: repoInfo.data.homepage || pagesUrl || '',
    downloadUrl: `${repoInfo.data.repoUrl}/archive/refs/heads/${repoInfo.data.defaultBranch}.zip`,
    repoCreatedAt: repoInfo.data.createdAt, // Data de criação do repositório
  };
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
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Usuário não encontrado`);
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
