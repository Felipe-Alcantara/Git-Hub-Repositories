/**
 * Utilitários para sincronização de projetos via GitHub Gist
 */

const GIST_DESCRIPTION = 'GitHub Projects Dashboard - Backup';
const GIST_FILENAME = 'github-projects-backup.json';

/**
 * Criar ou atualizar um Gist com os dados dos projetos
 * @param {Array} projects - Lista de projetos
 * @param {string} token - Token do GitHub
 * @param {string|null} gistId - ID do Gist existente (null para criar novo)
 * @returns {Promise<Object>} - Dados do Gist criado/atualizado
 */
export async function syncToGist(projects, token, gistId = null) {
  if (!token) {
    throw new Error('Token do GitHub é necessário para sincronizar');
  }

  const content = JSON.stringify({
    projects,
    lastSync: new Date().toISOString(),
    version: '1.0.0'
  }, null, 2);

  const gistData = {
    description: GIST_DESCRIPTION,
    public: false, // Gist secreto por padrão
    files: {
      [GIST_FILENAME]: {
        content
      }
    }
  };

  try {
    let response;
    
    if (gistId) {
      // Atualizar Gist existente
      console.log('[Gist] Atualizando Gist existente:', gistId);
      response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData)
      });
    } else {
      // Criar novo Gist
      console.log('[Gist] Criando novo Gist');
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erro ${response.status}: Falha ao sincronizar`);
    }

    const gist = await response.json();
    console.log('[Gist] Sincronização bem-sucedida:', gist.id);
    
    return {
      id: gist.id,
      url: gist.html_url,
      updatedAt: gist.updated_at
    };
  } catch (error) {
    console.error('[Gist] Erro ao sincronizar:', error);
    throw error;
  }
}

/**
 * Buscar projetos de um Gist
 * @param {string} gistId - ID do Gist
 * @param {string} token - Token do GitHub (opcional, mas recomendado)
 * @returns {Promise<Array>} - Lista de projetos
 */
export async function loadFromGist(gistId, token = null) {
  if (!gistId) {
    throw new Error('ID do Gist é necessário');
  }

  try {
    console.log('[Gist] Carregando dados do Gist:', gistId);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Gist não encontrado. Verifique o ID.');
      }
      throw new Error(`Erro ${response.status}: Falha ao carregar Gist`);
    }

    const gist = await response.json();
    
    // Verificar se o arquivo existe
    const file = gist.files[GIST_FILENAME];
    if (!file) {
      throw new Error('Arquivo de backup não encontrado no Gist');
    }

    const data = JSON.parse(file.content);
    console.log('[Gist] Dados carregados com sucesso:', {
      projectsCount: data.projects?.length || 0,
      lastSync: data.lastSync
    });

    return {
      projects: data.projects || [],
      lastSync: data.lastSync,
      version: data.version
    };
  } catch (error) {
    console.error('[Gist] Erro ao carregar:', error);
    throw error;
  }
}

/**
 * Verificar se um Gist existe
 * @param {string} gistId - ID do Gist
 * @param {string} token - Token do GitHub (opcional)
 * @returns {Promise<boolean>}
 */
export async function gistExists(gistId, token = null) {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'HEAD',
      headers
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Deletar um Gist permanentemente
 * @param {string} gistId - ID do Gist a ser deletado
 * @param {string} token - Token do GitHub
 * @returns {Promise<void>}
 */
export async function deleteGist(gistId, token) {
  if (!gistId) {
    throw new Error('ID do Gist é necessário');
  }

  if (!token) {
    throw new Error('Token do GitHub é necessário para deletar o Gist');
  }

  try {
    console.log('[Gist] Deletando Gist:', gistId);
    
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Gist não encontrado. Pode já ter sido deletado.');
      }
      const error = await response.json();
      throw new Error(error.message || `Erro ${response.status}: Falha ao deletar Gist`);
    }

    console.log('[Gist] ✅ Gist deletado com sucesso');
  } catch (error) {
    console.error('[Gist] ❌ Erro ao deletar:', error);
    throw error;
  }
}

/**
 * Salvar Gist ID no localStorage
 */
export function saveGistId(gistId) {
  localStorage.setItem('github_gist_id', gistId);
}

/**
 * Carregar Gist ID do localStorage
 */
export function loadGistId() {
  return localStorage.getItem('github_gist_id');
}

/**
 * Remover Gist ID do localStorage
 */
export function clearGistId() {
  localStorage.removeItem('github_gist_id');
}
