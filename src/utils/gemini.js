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

/**
 * Obter o modelo Gemini disponível para uso
 * @param {string} apiKey - API key do Gemini
 * @returns {Promise<string>} - Nome do modelo disponível
 */
async function getAvailableGeminiModel(apiKey) {
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

    if (geminiModels.length === 0) {
      console.log('[Gemini] Nenhum modelo estável encontrado, usando fallback');
      return 'gemini-1.5-pro';
    }

    // Preferir modelos na ordem: 1.5-pro, 1.0-pro, 2.0-flash, flash-latest, pro-latest
    const preferredOrder = [
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-2.0-flash-lite'
    ];

    for (const preferred of preferredOrder) {
      const model = geminiModels.find(m => m.name?.endsWith(`/${preferred}`));
      if (model) {
        const modelName = model.name.split('/').pop();
        console.log(`[Gemini] Usando modelo preferido: ${modelName}`);
        return modelName;
      }
    }

    // Usar o primeiro disponível
    const modelName = geminiModels[0].name.split('/').pop();
    console.log(`[Gemini] Usando primeiro modelo disponível: ${modelName}`);
    return modelName;

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

  const prompt = `Você é um assistente técnico especializado em análise de projetos de software.

Analise o seguinte projeto do GitHub e forneça uma explicação clara e objetiva em português:

**Nome do Projeto:** ${project.name}
**Descrição:** ${description}
**Linguagens/Tecnologias:** ${languages}

**README:**
${readme.substring(0, 5000)} ${readme.length > 5000 ? '...(truncado)' : ''}

Por favor, forneça uma explicação estruturada contendo:

1. **O que o projeto faz** (resumo objetivo em 2-3 linhas)
2. **Principais tecnologias e funcionalidades**
3. **Para quem é útil / Casos de uso**
4. **Como começar** (se houver instruções no README)

Seja conciso, técnico mas acessível. Use emojis para facilitar a leitura.`;

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
            temperature: 0.7,
            maxOutputTokens: 1024,
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

    return explanation;
  } catch (error) {
    console.error('[Gemini] Erro ao gerar explicação:', error);
    throw error;
  }
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
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
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
        const delayMs = Math.pow(2, attempt) * 1000;
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


