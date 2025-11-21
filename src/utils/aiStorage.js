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
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const str = JSON.stringify(messages);
    // Compressa com LZ-String para reduzir armazenamento
    const compressed = LZString.compressToUTF16(str);
    await set(key, compressed);
    return true;
  } catch (err) {
    console.warn('[aiStorage] Falha ao salvar no IndexedDB:', err);
    return false;
  }
}

export async function loadAiChat(projectId) {
  try {
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const compressed = await get(key);
    if (!compressed) return null;
    try {
      const str = LZString.decompressFromUTF16(compressed);
      return JSON.parse(str);
    } catch (err) {
      console.warn('[aiStorage] Falha ao descomprimir/parse:', err);
      return null;
    }
  } catch (err) {
    console.warn('[aiStorage] Falha ao carregar do IndexedDB:', err);
    return null;
  }
}

export async function deleteAiChat(projectId) {
  try {
    const key = AI_CHAT_KEY_PREFIX + projectId;
    await del(key);
    return true;
  } catch (err) {
    console.warn('[aiStorage] Falha ao deletar:', err);
    return false;
  }
}

/**
 * Fallback: salvar no localStorage comprimido (string)
 */
export function saveAiChatLocalFallback(projectId, messages) {
  try {
    const key = AI_CHAT_KEY_PREFIX + projectId;
    const str = JSON.stringify(messages);
    const compressed = LZString.compressToBase64(str);
    localStorage.setItem(key, compressed);
    return true;
  } catch (err) {
    console.warn('[aiStorage] Falha ao salvar no localStorage (fallback):', err);
    return false;
  }
}

export function loadAiChatLocalFallback(projectId) {
  try {
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
        console.warn('[aiStorage] load fallback: item não era JSON puro nem compressado');
        return null;
      }
    }

    try {
      return JSON.parse(str);
    } catch (err) {
      console.warn('[aiStorage] Falha ao parsear JSON após descompressão:', err);
      return null;
    }
  } catch (err) {
    console.warn('[aiStorage] Falha ao carregar fallback:', err);
    return null;
  }
}
