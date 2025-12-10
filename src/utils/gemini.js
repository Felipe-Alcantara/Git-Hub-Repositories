/**
 * Utilitários para integração com Google Gemini API
 */

const GEMINI_API_KEY_STORAGE = 'gemini-api-key';

/**
 * Salvar API key do Gemini no localStorage
 * @param {string} apiKey - API key do Gemini
 */
export function saveGeminiApiKey(apiKey) {
  if (apiKey) {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey);
  } else {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  }
}

/**
 * Carregar API key do Gemini do localStorage
 * @returns {string|null} - API key ou null
 */
export function loadGeminiApiKey() {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE);
}

// Auxiliar: percorre a estrutura de arquivos (salva em project.details.structure) e retorna prioridade de arquivos
export function flattenStructure(structure, parentPath = '') {
  if (!Array.isArray(structure)) return [];
  const files = [];

  for (const node of structure) {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.type === 'file') {
      files.push({ path, name: node.name, content: node.content || '' });
    } else if (node.type === 'folder') {
      files.push(...flattenStructure(node.children || [], path));
    }
  }

  return files;
}

// Coleta prévias de arquivos para incluir no prompt. Limita o tamanho total para evitar exceder tokens
export function collectFilesPreview(project, maxTotalChars = 6000, perFileChars = 1200) {
  const structure = project?.details?.structure;
  if (!structure) return [];

  const files = flattenStructure(structure);

  // Priorizar README, package.json, index.html e arquivos JS/TS
  const preferredOrder = ['README.md', 'README.txt', 'package.json', 'index.html', 'index.js', 'App.jsx'];

  const preferred = [];
  const others = [];

  for (const f of files) {
    if (preferredOrder.includes(f.name)) preferred.push(f);
    else others.push(f);
  }

  const ordered = [...preferred, ...others];

  const result = [];
  let total = 0;

  for (const f of ordered) {
    if (total >= maxTotalChars) break;
    const trimmed = (f.content || '').substring(0, perFileChars);
    if (!trimmed) continue;
    const preview = trimmed.length === perFileChars ? `${trimmed} ... (truncated)` : trimmed;
    result.push({ path: f.path, preview });
    total += preview.length;
  }

  return result;
}

// Cache para evitar chamadas repetidas de listagem de modelos
let cachedModelName = null;
let cachedModelKey = null;
const GEMINI_MODEL_CACHE_KEY = 'gemini-cached-model-v2';

/**
 * Obter o modelo Gemini disponível para uso
 * @param {string} apiKey - API key do Gemini
 * @returns {Promise<string>} - Nome do modelo disponível
 */
async function getAvailableGeminiModel(apiKey) {
  // 1. Verificar cache em memória
  if (cachedModelName && cachedModelKey === apiKey) {
    return cachedModelName;
  }

  // 2. Verificar cache persistente (localStorage)
  try {
    const cached = localStorage.getItem(GEMINI_MODEL_CACHE_KEY);
    if (cached) {
      const { key, model, timestamp } = JSON.parse(cached);
      // Cache válido por 24h e se a chave for a mesma
      if (key === apiKey && (Date.now() - timestamp < 24 * 60 * 60 * 1000)) {
        console.log(`[Gemini] Usando modelo do cache persistente: ${model}`);
        // Atualizar cache em memória
        cachedModelName = model;
        cachedModelKey = apiKey;
        return model;
      }
    }
  } catch (e) {
    console.warn('[Gemini] Erro ao ler cache de modelo:', e);
  }

  try {
    console.log('[Gemini] Buscando modelos disponíveis...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.log('[Gemini] Falha ao listar modelos, usando fallback');
      // Se falhar, não cacheamos para tentar novamente depois
      return 'gemini-1.5-pro'; // Fallback
    }

    const data = await response.json();
    const geminiModels = data.models?.filter(model =>
      model.name?.includes('gemini') &&
      !model.name?.includes('deprecated') &&
      !model.name?.includes('vision') && // Evitar modelos de visão por enquanto
      !model.name?.includes('preview') && // Evitar modelos preview que podem ter rate limits
      !model.name?.includes('exp') && // Evitar experimental
      !model.name?.includes('thinking') && // Evitar thinking models
      !model.name?.includes('robotics') && // Evitar robotics
      !model.name?.includes('computer-use') // Evitar computer-use
    ) || [];

    console.log('[Gemini] Modelos filtrados:', geminiModels.map(m => m.name));

    let selectedModel = 'gemini-1.5-pro';

    if (geminiModels.length === 0) {
      console.log('[Gemini] Nenhum modelo estável encontrado, usando fallback');
    } else {
      // Preferir modelos na ordem: 2.5-flash, 1.5-pro, 1.0-pro, 2.0-flash, flash-latest, pro-latest
      const preferredOrder = [
        'gemini-2.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-2.0-flash-lite'
      ];

      const preferredModel = preferredOrder.find(preferred => 
        geminiModels.some(m => m.name?.endsWith(`/${preferred}`))
      );

      if (preferredModel) {
        const model = geminiModels.find(m => m.name?.endsWith(`/${preferredModel}`));
        selectedModel = model.name.split('/').pop();
        console.log(`[Gemini] Usando modelo preferido: ${selectedModel}`);
      } else {
        // Usar o primeiro disponível
        selectedModel = geminiModels[0].name.split('/').pop();
        console.log(`[Gemini] Usando primeiro modelo disponível: ${selectedModel}`);
      }
    }

    // Salvar no cache em memória
    cachedModelName = selectedModel;
    cachedModelKey = apiKey;

    // Salvar no cache persistente
    try {
      localStorage.setItem(GEMINI_MODEL_CACHE_KEY, JSON.stringify({
        key: apiKey,
        model: selectedModel,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[Gemini] Erro ao salvar cache de modelo:', e);
    }
    
    return selectedModel;

  } catch (error) {
    console.error('[Gemini] Erro ao buscar modelos:', error);
    return 'gemini-1.5-pro'; // Fallback
  }
}

/**
 * Explicar um projeto usando Google Gemini
 * @param {Object} project - Dados do projeto
 * @param {string} apiKey - API key do Gemini
 * @returns {Promise<string>} - Explicação gerada
 */
export async function explainProjectWithGemini(project, apiKey) {
  if (!apiKey) {
    throw new Error('API key do Google Gemini não configurada');
  }

  // Preparar contexto do projeto
  const readme = project.details?.readme || 'README não disponível';
  const languages = project.languages?.join(', ') || 'Não especificado';
  const description = project.description || 'Sem descrição';

  const prompt = `Você é um assistente técnico especializado em análise de projetos de software no GitHub.

Analise o seguinte projeto e forneça uma explicação clara, objetiva e bem estruturada em português:

**📋 INFORMAÇÕES DO PROJETO**
• **Nome:** ${project.name}
• **Descrição:** ${description}
• **Tecnologias:** ${languages}

**📖 CONTEÚDO DO README**
${readme.substring(0, 5000)} ${readme.length > 5000 ? '...(conteúdo truncado)' : ''}

**📁 AMOSTRA DE ARQUIVOS DO PROJETO**
${collectFilesPreview(project).map(f => `- ${f.path}: ${f.preview}`).join('\n')}

**🔍 ANÁLISE ESTRUTURADA**

Por favor, organize sua resposta usando EXATAMENTE esta estrutura com os emojis indicados:

## 🎯 **O QUE FAZ**
[Resumo objetivo em algumas linhas do que o projeto faz]

## 🛠️ **TECNOLOGIAS PRINCIPAIS**
[Bullet points das principais tecnologias, frameworks e bibliotecas identificadas]

## ✨ **FUNCIONALIDADES-CHAVE**
[Bullet points das principais funcionalidades do projeto]

## 👥 **PÚBLICO-ALVO**
[Para quem é útil / casos de uso principais]

## 🚀 **COMO COMEÇAR**
[Instruções básicas de instalação/configuração se encontradas no README, senão omitir]

## 📊 **COMPLEXIDADE**
[Estimativa simples: Básico/Intermediário/Avançado]

IMPORTANTE:
- Seja conciso mas informativo
- Use markdown para formatação (negrito, itálico, listas)
- Mantenha tom técnico mas acessível
- Se alguma seção não for aplicável, seja descritivo
- Foque em informações objetivas encontradas no projeto, mas explique de forma clara para leigos também`;

  try {
    // Obter modelo disponível
    const modelName = await getAvailableGeminiModel(apiKey);

    console.log('[Gemini] Fazendo chamada para API com key:', apiKey.substring(0, 10) + '...');
    console.log('[Gemini] Usando modelo:', modelName);

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096, // Aumentado para reduzir truncamento em saídas grandes
            topP: 0.8,
            topK: 40,
          }
        })
      },
      3 // Máximo de 3 tentativas
    );

    console.log('[Gemini] Status da resposta:', response.status);

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        console.error('[Gemini] Erro 400:', error);
        throw new Error(`API Gemini: ${error.error?.message || 'Requisição inválida'}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('❌ API key inválida ou sem permissão. Verifique sua chave nas configurações.');
      }
      if (response.status === 404) {
        throw new Error('❌ URL da API não encontrada. Verifique se a API key está correta.');
      }
      if (response.status === 429) {
        throw new Error('⏱️ Limite de requisições atingido!\n\n📊 Sobre limites da API gratuita:\n• 60 requisições por minuto\n• 1.000 requisições por dia\n• Aguarde alguns minutos antes de tentar novamente\n\n💡 Dica: Use a API key apenas quando necessário para evitar limites.');
      }
      const errorText = await response.text();
      console.error('[Gemini] Erro não tratado:', response.status, errorText);
      throw new Error(`Erro ${response.status}: Falha ao gerar explicação`);
    }

    const data = await response.json();
    
    // Extrair texto da resposta
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!explanation) {
      throw new Error('Resposta vazia da API');
    }

    // Se parece estar truncada, tentar uma continuação simples
    if (looksTruncated(explanation)) {
      try {
        const contPrompt = `${prompt}\n\nPor favor, continue a resposta anterior onde parou e conclua a frase/ideia. Mantenha o mesmo formato e a linguagem (Português).`;
        const contResp = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contPrompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 2048, topP: 0.8, topK: 40 }
            })
          },
          1
        );

        if (contResp && contResp.ok) {
          const contData = await contResp.json();
          const contText = contData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (contText) return explanation + '\n\n' + contText;
        }
      } catch (err) {
        console.warn('[Gemini] Falha ao pedir continuação, retornando texto parcial', err);
      }
    }

    return explanation;
  } catch (error) {
    console.error('[Gemini] Erro ao gerar explicação:', error);
    throw error;
  }
}

/**
 * Fazer uma pergunta sobre um projeto para o Gemini
 * @param {object} project - Dados do projeto
 * @param {string} question - Pergunta do usuário
 * @param {Array} conversationHistory - Histórico da conversa
 * @param {string} apiKey - API key do Gemini
 * @returns {Promise<string>} - Resposta da IA
 */
export async function askGeminiQuestion(project, question, conversationHistory, apiKey, activeSection = null) {
  if (!apiKey) {
    throw new Error('API key do Google Gemini não configurada');
  }

  // Preparar contexto do projeto
  const readme = project.details?.readme || 'README não disponível';
  const languages = project.languages?.join(', ') || 'Não especificado';
  const description = project.description || 'Sem descrição';

  // Contexto da aba ativa
  let sectionContext = '';
  if (activeSection) {
    const sectionLabels = {
      'readme': 'README - Documentação principal do projeto',
      'ideas': 'Ideias - Conceitos e sugestões para o projeto',
      'improvements': 'Melhorias - Melhorias planejadas ou implementadas',
      'problems': 'Problemas - Issues e bugs conhecidos',
      'purpose': 'Propósito - Objetivo e missão do projeto',
      'users': 'Usuários - Público-alvo e personas',
      'mvp': 'MVP - Produto mínimo viável',
      'stack': 'Stack Técnica - Tecnologias e ferramentas',
      'upgrades': 'Upgrades - Próximas atualizações e features',
      'structure': 'Estrutura do Projeto - Organização de arquivos e pastas',
      'sketches': 'Desenhos/Sketches - Diagramas e esboços visuais'
    };

    sectionContext = `\n\n**ABA ATUALMENTE ATIVA:** ${sectionLabels[activeSection] || activeSection}`;
    sectionContext += `\n**CONTEÚDO DA ABA ATIVA:** ${project.details?.[activeSection] || 'Conteúdo não disponível nesta aba'}`;
  }

  // Construir histórico da conversa
  let conversationContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = '\n\n**HISTÓRICO DA CONVERSA:**\n';
    conversationHistory.slice(-10).forEach(msg => { // Últimas 10 mensagens para não exceder limite
      const role = msg.type === 'user' ? 'Usuário' : 'IA';
      conversationContext += `${role}: ${msg.content}\n`;
    });
  }

  const prompt = `Você é um assistente especializado em análise de projetos de software no GitHub.

**CONTEXTO DO PROJETO:**
• Nome: ${project.name}
• Descrição: ${description}
• Tecnologias: ${languages}

**README (resumido):**
${readme.substring(0, 3000)}${readme.length > 3000 ? '...' : ''}

**📁 AMOSTRA DE ARQUIVOS DO PROJETO**
${collectFilesPreview(project).map(f => `- ${f.path}: ${f.preview}`).join('\n')}

${sectionContext}${conversationContext}

**PERGUNTA DO USUÁRIO:**
${question}

**INSTRUÇÕES:**
- Responda de forma clara, objetiva e útil
- Use português brasileiro
- Seja técnico mas acessível
- Foque em informações relevantes do projeto
- Considere o contexto da aba atualmente ativa (${activeSection || 'nenhuma'})
- Use markdown para formatação quando apropriado
- Mantenha o contexto da conversa anterior
- Se não souber algo específico, diga claramente

Responda à pergunta acima:`;

  try {
    // Obter modelo disponível
    const modelName = await getAvailableGeminiModel(apiKey);

    console.log('[Gemini] Fazendo pergunta sobre projeto:', project.name);
    console.log('[Gemini] Usando modelo:', modelName);

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096, // Aumentado para permitir respostas maiores
            topP: 0.8,
            topK: 40,
          }
        })
      },
      3 // Máximo de 3 tentativas
    );

    console.log('[Gemini] Status da resposta da pergunta:', response.status);

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        console.error('[Gemini] Erro 400:', error);
        throw new Error(`API Gemini: ${error.error?.message || 'Requisição inválida'}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('❌ API key inválida ou sem permissão. Verifique sua chave nas configurações.');
      }
      if (response.status === 404) {
        throw new Error('❌ URL da API não encontrada. Verifique se a API key está correta.');
      }
      if (response.status === 429) {
        throw new Error('⏱️ Limite de requisições atingido!\n\n📊 Sobre limites da API gratuita:\n• 60 requisições por minuto\n• 1.000 requisições por dia\n• Aguarde alguns minutos antes de tentar novamente\n\n💡 Dica: Use a API key apenas quando necessário para evitar limites.');
      }
      const errorText = await response.text();
      console.error('[Gemini] Erro não tratado:', response.status, errorText);
      throw new Error(`Erro ${response.status}: Falha ao enviar pergunta`);
    }

    const data = await response.json();

    // Extrair texto da resposta
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      throw new Error('Resposta vazia da API');
    }

    // Se estiver truncado, solicitar continuação (uma tentativa)
    if (looksTruncated(answer)) {
      try {
        const contPrompt = `${prompt}\n\nPor favor, continue a resposta anterior onde parou e conclua a frase/ideia. Mantenha o mesmo formato e a linguagem (Português).`;
        const contResp = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contPrompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 2048, topP: 0.8, topK: 40 }
            })
          },
          1
        );

        if (contResp && contResp.ok) {
          const contData = await contResp.json();
          const contText = contData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (contText) return answer + '\n\n' + contText;
        }
      } catch (err) {
        console.warn('[Gemini] Falha ao pedir continuação, retornando texto parcial', err);
      }
    }

    return answer;
  } catch (error) {
    console.error('[Gemini] Erro ao fazer pergunta:', error);
    throw error;
  }
}

// Heurística simples para detectar possível truncamento de resposta.
export function looksTruncated(text) {
  if (!text) return false;
  const trimmed = text.trim();

  // Procurar marcadores explícitos
  const markers = ['(truncated)', '...(conteúdo truncado)', '... (truncated)', '... (continua)'];
  if (markers.some(m => trimmed.includes(m))) return true;

  // Se terminar com reticências, pode estar incompleto
  if (/\.\.\.$|\u2026$/.test(trimmed)) return true;

  return false;
}

/**
 * Função auxiliar para fazer requisições com retry automático
 * @param {string} url - URL da requisição
 * @param {object} options - Opções da requisição
 * @param {number} maxRetries - Número máximo de tentativas
 * @returns {Promise<Response>} - Resposta da requisição
*/
 
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Tentativa ${attempt}/${maxRetries} para: ${url.split('?')[0]}`);
      const response = await fetch(url, options);

      // Se não é erro 429, retornar imediatamente
      if (response.status !== 429) {
        return response;
      }

      // Se é erro 429 e não é a última tentativa, aguardar e tentar novamente
      if (attempt < maxRetries) {
        // Aumentado o tempo de espera para lidar melhor com rate limits
        // 2s, 4s, 8s -> 4s, 8s, 16s
        const delayMs = Math.pow(2, attempt) * 2000; 
        console.log(`[Gemini] Rate limit atingido, aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Última tentativa falhou com 429
      return response;

    } catch (error) {
      lastError = error;
      console.error(`[Gemini] Erro na tentativa ${attempt}:`, error);

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 2000;
        console.log(`[Gemini] Aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Verificar se a API key é válida
 * @param {string} apiKey - API key do Gemini
 * @returns {Promise<boolean>} - true se válida
 */
export async function verifyGeminiApiKey(apiKey) {
  try {
    console.log('[Gemini] Verificando API key...');

    // Tentar listar os modelos disponíveis para verificar se a API key é válida
    console.log('[Gemini] Testando listagem de modelos...');
    const listResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('[Gemini] Status da listagem de modelos:', listResponse.status);

    if (!listResponse.ok) {
      console.log('[Gemini] Listagem falhou - API key inválida');
      return false;
    }

    const modelsData = await listResponse.json();
    console.log('[Gemini] Modelos disponíveis:', modelsData.models?.map(m => m.name) || []);

    // Verificar se temos algum modelo Gemini disponível
    const geminiModels = modelsData.models?.filter(model =>
      model.name?.includes('gemini') && !model.name?.includes('deprecated')
    ) || [];

    if (geminiModels.length === 0) {
      console.log('[Gemini] Nenhum modelo Gemini encontrado');
      return false;
    }

    // Se conseguimos listar os modelos com sucesso, a API key é válida
    // Isso evita rate limiting ao fazer uma segunda requisição de teste
    console.log('[Gemini] API key válida - conseguiu listar modelos');

    // OTIMIZAÇÃO: Salvar o modelo no cache para evitar nova requisição
    try {
      const preferredOrder = [
        'gemini-2.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-2.0-flash-lite'
      ];

      let selectedModel = geminiModels[0].name.split('/').pop();
      
      const preferredModel = preferredOrder.find(preferred => 
        geminiModels.some(m => m.name?.endsWith(`/${preferred}`))
      );

      if (preferredModel) {
        const model = geminiModels.find(m => m.name?.endsWith(`/${preferredModel}`));
        selectedModel = model.name.split('/').pop();
      }
      
      // Atualizar variáveis globais e localStorage
      cachedModelName = selectedModel;
      cachedModelKey = apiKey;
      localStorage.setItem(GEMINI_MODEL_CACHE_KEY, JSON.stringify({
        key: apiKey,
        model: selectedModel,
        timestamp: Date.now()
      }));
      console.log(`[Gemini] Cache atualizado durante verificação: ${selectedModel}`);
    } catch (e) {
      console.warn('[Gemini] Erro ao salvar cache de modelo na verificação:', e);
    }

    return true;

  } catch (error) {
    console.error('[Gemini] Erro na verificação:', error);
    console.error('[Gemini] Detalhes do erro:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return false;
  }
}


