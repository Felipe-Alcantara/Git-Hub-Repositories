# 🧪 Testes - GitHub Projects Dashboard

## Configuração

Este projeto usa **Vitest** + **Testing Library** para testes unitários e de integração.

### Instalação

```bash
npm install
```

### Executar Testes

```bash
# Rodar todos os testes
npm test

# Rodar com interface visual
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

## Estrutura de Testes

```
src/
├── components/
│   └── __tests__/
│       └── ImportProfileModal.test.jsx
├── utils/
│   └── __tests__/
│       └── update-detection.test.js
└── test/
    └── setup.js
```

## Testes Implementados

### 1. Detecção de Atualizações (`update-detection.test.js`)

Testes unitários para a lógica de detecção de atualizações em repositórios:

#### ✅ Comparação de Datas
- Identifica repositório atualizado quando `updatedAt` é mais recente
- Identifica repositório não atualizado quando `updatedAt` é igual
- Identifica repositório não atualizado quando `updatedAt` é mais antigo

#### ✅ Identificação de Repositórios Atualizados
- Cria Map de projetos existentes por `repoUrl`
- Identifica múltiplos repositórios atualizados em uma lista

#### ✅ Seleção Automática
- Seleciona apenas repositórios novos e atualizados
- Seleciona todos se nenhum for novo ou atualizado

#### ✅ Preservação de Dados Locais
- Preserva `complexity`, `isCompleted`, `group` e `details` ao atualizar
- Atualiza apenas dados vindos do GitHub (descrição, linguagens, README)

#### ✅ Contadores de Importação
- Conta corretamente novos, atualizados e pulados
- Gera mensagem correta de feedback

### 2. Integração do Modal (`ImportProfileModal.test.jsx`)

Testes de integração para o componente `ImportProfileModal`:

#### ✅ Interface Visual
- Exibe badge "✨ Atualizado" em repositórios com atualizações
- Exibe mensagem informando quantidade de atualizações detectadas

#### ✅ Seleção Automática
- Seleciona automaticamente apenas repositórios novos e atualizados
- Atualiza contador no botão "Importar X"

#### ✅ Preservação de Dados
- Preserva dados locais ao atualizar repositório
- Chama `onImport` com ID existente para atualização

#### ✅ Fluxo Completo
- Busca repositórios do GitHub
- Detecta atualizações
- Importa/atualiza corretamente

## Cobertura de Testes

Os testes cobrem:

- ✅ Lógica de comparação de datas
- ✅ Identificação de repositórios atualizados
- ✅ Seleção automática de repositórios
- ✅ Preservação de dados locais
- ✅ Contadores e mensagens de feedback
- ✅ Integração com componentes React
- ✅ Interação do usuário (busca, seleção, importação)

## Mocks

### localStorage
```javascript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
```

### fetch
```javascript
global.fetch = vi.fn();
```

### Módulos
- `utils/github` - Funções de integração com GitHub API
- `utils/storage` - Funções de persistência local

## Boas Práticas

1. **Isolamento** - Cada teste é independente e não afeta outros
2. **Mocks** - Dependências externas são mockadas
3. **Clareza** - Nomes descritivos e estrutura organizada
4. **Cobertura** - Testa casos de sucesso, erro e edge cases
5. **Manutenibilidade** - Fácil de entender e modificar

## Adicionar Novos Testes

### Teste Unitário

```javascript
// src/utils/__tests__/minha-funcao.test.js
import { describe, it, expect } from 'vitest';
import { minhaFuncao } from '../minha-funcao';

describe('minhaFuncao', () => {
  it('deve fazer algo específico', () => {
    const resultado = minhaFuncao('input');
    expect(resultado).toBe('output esperado');
  });
});
```

### Teste de Componente

```javascript
// src/components/__tests__/MeuComponente.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeuComponente from '../MeuComponente';

describe('MeuComponente', () => {
  it('deve renderizar corretamente', () => {
    render(<MeuComponente />);
    expect(screen.getByText('Texto esperado')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Testes não rodam
```bash
# Limpar cache
npm run test -- --clearCache

# Verificar configuração
cat vitest.config.js
```

### Mock não funciona
Verifique se o mock está sendo feito antes do import:
```javascript
vi.mock('../modulo', () => ({
  funcao: vi.fn(),
}));
```

## Referências

- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Library - React](https://testing-library.com/docs/react-testing-library/intro/)
