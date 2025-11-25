import { get, set, del } from 'idb-keyval';
import LZString from 'lz-string';

// Chaves padrão no IndexedDB
const AI_CHAT_KEY_PREFIX = 'aiChat_';

/**
 * Salva o histórico de mensagens em IndexedDB com compressão.
 * @param {string} projectId
 * @param {Array} messages
 */
export async function saveAiChat(projectId, messages) {
  try {
    console.debug('[aiStorage] saveAiChat - salvando mensagens para projeto', projectId, 'count:', messages?.length || 0);
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const str = JSON.stringify(messages);
    // Compressa com LZ-String para reduzir armazenamento
    const compressed = LZString.compressToUTF16(str);
    await set(key, compressed);
    return true;
  } catch (err) {
    console.warn('[aiStorage] Falha ao salvar no IndexedDB para projeto', projectId, err);
    return false;
  }
}

export async function loadAiChat(projectId) {
  try {
    console.debug('[aiStorage] loadAiChat - carregando mensagens para projeto', projectId);
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const compressed = await get(key);
    if (!compressed) return null;
    try {
      const str = LZString.decompressFromUTF16(compressed);
      return JSON.parse(str);
    } catch (err) {
      console.warn('[aiStorage] Falha ao descomprimir/parse para projeto', projectId, err);
      return null;
    }
  } catch (err) {
    console.warn('[aiStorage] Falha ao carregar do IndexedDB para projeto', projectId, err);
    return null;
  }
}

export async function deleteAiChat(projectId) {
  try {
    console.debug('[aiStorage] deleteAiChat - removendo mensagens salvas para projeto', projectId);
    const key = AI_CHAT_KEY_PREFIX + projectId;
    await del(key);
    return true;
  } catch (err) {
    console.warn('[aiStorage] Falha ao deletar para projeto', projectId, err);
    return false;
  }
}

/**
 * Fallback: salvar no localStorage comprimido (string)
 */
export function saveAiChatLocalFallback(projectId, messages) {
  try {
    console.debug('[aiStorage] saveAiChatLocalFallback - salvando fallback para projeto', projectId, 'count:', messages?.length || 0);
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const str = JSON.stringify(messages);
    const compressed = LZString.compressToBase64(str);
    localStorage.setItem(key, compressed);
    return true;
  } catch (err) {
    console.warn('[aiStorage] Falha ao salvar no localStorage (fallback) para projeto', projectId, err);
    return false;
  }
}

export function loadAiChatLocalFallback(projectId) {
  try {
    console.debug('[aiStorage] loadAiChatLocalFallback - carregando fallback para projeto', projectId);
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const compressed = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!compressed) return null;
    // Tenta descomprimir de Base64 (formato que usamos ao salvar)
    let str = null;
    try {
      str = LZString.decompressFromBase64(compressed);
    } catch (err) {
      // se falhar na descompressão, ignoramos e tentamos parsear como JSON puro
      str = null;
    }

    // Se não foi possível descomprimir, talvez seja um JSON puro (versões antigas)
    if (str === null) {
      try {
        return JSON.parse(compressed);
      } catch (err) {
        // Não é JSON puro: talvez seja um conteúdo corrompido - relança como null
        console.warn('[aiStorage] load fallback: item não era JSON puro nem compressado para projeto', projectId);
        return null;
      }
    }

    try {
      return JSON.parse(str);
    } catch (err) {
      console.warn('[aiStorage] Falha ao parsear JSON após descompressão para projeto', projectId, err);
      return null;
    }
  } catch (err) {
    console.warn('[aiStorage] Falha ao carregar fallback para projeto', projectId, err);
    return null;
  }
}
