// Sistema de gerenciamento de tags

// Tags padrão de linguagens e tecnologias
export const DEFAULT_TAGS = [
  // Frontend
  'JavaScript',
  'TypeScript',
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'HTML',
  'CSS',
  'Tailwind CSS',
  'Bootstrap',
  'SASS',
  
  // Backend
  'Node.js',
  'Python',
  'Java',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'Rust',
  'C++',
  'C',
  
  // Mobile
  'React Native',
  'Flutter',
  'Swift',
  'Kotlin',
  'Dart',
  
  // Banco de Dados
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'SQLite',
  'Redis',
  'Firebase',
  
  // Ferramentas
  'Git',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'Vite',
  'Webpack',
  'Next.js',
  'Express',
  'FastAPI',
  'Django',
  'Flask',
].sort();

const STORAGE_KEY = 'github-repos-custom-tags';

/**
 * Obtém todas as tags (padrão + customizadas)
 * @returns {Array<string>} - Lista de tags
 */
export function getAllTags() {
  const customTags = getCustomTags();
  const allTags = [...DEFAULT_TAGS, ...customTags];
  // Remove duplicatas e ordena
  return [...new Set(allTags)].sort();
}

/**
 * Obtém tags customizadas do localStorage
 * @returns {Array<string>} - Lista de tags customizadas
 */
export function getCustomTags() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar tags customizadas:', error);
    return [];
  }
}

/**
 * Adiciona uma nova tag customizada
 * @param {string} tag - Tag a ser adicionada
 * @returns {boolean} - true se adicionada, false se já existe
 */
export function addCustomTag(tag) {
  if (!tag || typeof tag !== 'string') return false;
  
  const trimmedTag = tag.trim();
  if (!trimmedTag) return false;
  
  const allTags = getAllTags();
  
  // Verifica se já existe (case-insensitive)
  const exists = allTags.some(t => t.toLowerCase() === trimmedTag.toLowerCase());
  if (exists) return false;
  
  const customTags = getCustomTags();
  customTags.push(trimmedTag);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTags));
    return true;
  } catch (error) {
    console.error('Erro ao salvar tag customizada:', error);
    return false;
  }
}

/**
 * Remove uma tag customizada
 * @param {string} tag - Tag a ser removida
 */
export function removeCustomTag(tag) {
  const customTags = getCustomTags();
  const filtered = customTags.filter(t => t !== tag);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erro ao remover tag customizada:', error);
  }
}

/**
 * Filtra tags baseado em uma busca
 * @param {string} search - Texto de busca
 * @returns {Array<string>} - Tags filtradas
 */
export function searchTags(search) {
  if (!search) return getAllTags();
  
  const searchLower = search.toLowerCase();
  return getAllTags().filter(tag => 
    tag.toLowerCase().includes(searchLower)
  );
}

/**
 * Valida se uma tag é válida
 * @param {string} tag - Tag a ser validada
 * @returns {boolean} - true se válida
 */
export function isValidTag(tag) {
  if (!tag || typeof tag !== 'string') return false;
  const trimmed = tag.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}
