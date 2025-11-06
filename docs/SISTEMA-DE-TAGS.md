# 🏷️ Sistema de Tags

## Visão Geral

O sistema de tags permite organizar e filtrar projetos por linguagens e tecnologias de forma inteligente e personalizável.

## Características

### ✨ Tags Pré-definidas

O sistema vem com **50+ tags** de tecnologias comuns:

#### Frontend
- JavaScript, TypeScript, React, Vue, Angular, Svelte
- HTML, CSS, Tailwind CSS, Bootstrap, SASS

#### Backend
- Node.js, Python, Java, C#, PHP, Ruby, Go, Rust, C++, C

#### Mobile
- React Native, Flutter, Swift, Kotlin, Dart

#### Banco de Dados
- MongoDB, PostgreSQL, MySQL, SQLite, Redis, Firebase

#### Ferramentas
- Git, Docker, Kubernetes, AWS, Azure
- Vite, Webpack, Next.js, Express, FastAPI, Django, Flask

### 🎨 Interface Intuitiva

#### Seletor de Tags
- **Autocomplete**: Digite e veja sugestões
- **Criar novas**: Pressione Enter para criar tags personalizadas
- **Visual**: Tags coloridas com ícones
- **Remover**: Clique no X para remover

#### Filtros
- **Múltiplas tags**: Filtre por várias tecnologias ao mesmo tempo
- **Visual claro**: Tags ativas destacadas em azul
- **Fácil de limpar**: Botão para remover todos os filtros

## Como Usar

### Adicionar Tags ao Projeto

1. Abra o modal "Novo Projeto"
2. No campo "Linguagens/Tecnologias":
   - **Digite** para buscar tags existentes
   - **Selecione** da lista de sugestões
   - **Pressione Enter** para criar uma nova tag
   - **Clique no X** para remover uma tag

### Criar Tag Personalizada

```
1. Digite o nome da tecnologia
2. Pressione Enter
3. A tag é criada e adicionada ao projeto
4. Ficará disponível para todos os projetos futuros
```

### Filtrar por Tags

1. Clique em **"Filtros"** na página inicial
2. Na seção "Filtrar por Tecnologias":
   - **Clique** em uma tag para ativar o filtro
   - **Clique novamente** para desativar
   - **Múltiplas tags**: Mostra projetos que têm TODAS as tags selecionadas

## Exemplos Práticos

### Exemplo 1: Projeto Full Stack

```javascript
Tags: JavaScript, React, Node.js, MongoDB, Express
```

**Resultado**: Projeto aparece quando filtrar por qualquer uma dessas tecnologias.

### Exemplo 2: Projeto Mobile

```javascript
Tags: React Native, TypeScript, Firebase, Expo
```

**Resultado**: Ao filtrar por "React Native" + "TypeScript", só mostra projetos com ambas.

### Exemplo 3: Tag Personalizada

```
Cenário: Você usa uma biblioteca específica "Zustand"

1. No modal, digite "Zustand"
2. Pressione Enter
3. Tag criada! ✅
4. Use em outros projetos também
```

## Armazenamento

### Tags Padrão
- ✅ Pré-definidas no código
- ✅ Sempre disponíveis
- ✅ Não podem ser removidas

### Tags Customizadas
- 💾 Salvas no `localStorage`
- 🔄 Sincronizam entre sessões
- ♻️ Podem ser removidas (em desenvolvimento)

## Interface do TagSelector

### Estados Visuais

#### Normal
```
┌──────────────────────────────────────┐
│ Digite para buscar ou criar tags... │
└──────────────────────────────────────┘
```

#### Com Tags
```
┌────────────────────────────────────────────┐
│ [JavaScript ×] [React ×] Adicionar mais... │
└────────────────────────────────────────────┘
```

#### Sugestões
```
┌──────────────────────────┐
│ 🏷️ JavaScript           │
│ 🏷️ TypeScript           │
│ 🏷️ React                │
└──────────────────────────┘
```

#### Criar Nova
```
┌────────────────────────────┐
│ ➕ Criar nova tag: Zustand │
└────────────────────────────┘
```

## Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Digite` | Buscar tags |
| `Enter` | Adicionar/criar tag |
| `Backspace` | Remover última tag (se input vazio) |
| `Esc` | Fechar sugestões |

## Filtros Avançados

### Combinações

#### 1. Filtrar por Tecnologia Única
```
Filtro: React
Resultado: Todos projetos com React
```

#### 2. Filtrar por Múltiplas Tecnologias
```
Filtros: React + TypeScript
Resultado: Apenas projetos com AMBAS as tecnologias
```

#### 3. Combinar com Outros Filtros
```
Filtros: React + Complexidade: Simples + Status: Concluído
Resultado: Projetos simples, concluídos, que usam React
```

## Código de Exemplo

### Adicionar Tags Programaticamente

```javascript
import { addCustomTag, getAllTags } from './utils/tags';

// Adicionar nova tag
addCustomTag('Minha Biblioteca');

// Obter todas as tags
const tags = getAllTags();
console.log(tags); // ['Angular', 'JavaScript', 'Minha Biblioteca', ...]

// Buscar tags
import { searchTags } from './utils/tags';
const results = searchTags('react');
// ['React', 'React Native']
```

### Usar no Componente

```jsx
import TagSelector from './components/TagSelector';

function MeuComponente() {
  const [tags, setTags] = useState([]);

  return (
    <TagSelector
      selectedTags={tags}
      onChange={setTags}
    />
  );
}
```

## Validações

### Tag Válida
- ✅ Mínimo: 1 caractere
- ✅ Máximo: 50 caracteres
- ✅ Qualquer caractere permitido
- ✅ Espaços removidos automaticamente

### Tag Inválida
- ❌ String vazia
- ❌ Apenas espaços
- ❌ Mais de 50 caracteres

## Integração com GitHub API

Quando você busca um repositório:

```
URL: https://github.com/facebook/react

Tags Detectadas Automaticamente:
✅ JavaScript
✅ TypeScript
✅ Flow

Você pode:
- Manter as tags detectadas
- Adicionar mais tags manualmente
- Remover tags que não quer
```

## Tips & Tricks

### 🎯 Dica 1: Padronize Nomes
Use sempre os mesmos nomes para tags similares:
- ✅ "Node.js" (sempre)
- ❌ "Node", "NodeJS", "node.js" (inconsistente)

### 🎯 Dica 2: Tags Específicas
Crie tags para frameworks específicos:
```
Framework: Next.js, Remix, Gatsby
Database: Prisma, Sequelize, TypeORM
```

### 🎯 Dica 3: Filtros Rápidos
Salve combinações comuns de filtros (em desenvolvimento):
```
"Frontend React": React + TypeScript + Tailwind
"Backend Node": Node.js + Express + MongoDB
```

## Troubleshooting

### Problema: Tag não aparece nas sugestões

**Causa**: Tag pode estar escrita diferente

**Solução**: 
1. Verifique a grafia
2. Tente criar como nova tag
3. Use busca parcial (ex: "reac" encontra "React")

### Problema: Muitas tags customizadas

**Solução** (futura):
1. Sistema de gerenciamento de tags
2. Poder remover tags não utilizadas
3. Renomear tags em lote

### Problema: Tags de projetos antigos

**Causa**: Projetos criados antes do sistema de tags usavam strings simples

**Solução**:
1. Edite o projeto
2. Sistema converte automaticamente
3. Salve novamente

## Roadmap

### Planejado para Versões Futuras

- [ ] Gerenciador de tags customizadas
- [ ] Renomear tags em lote
- [ ] Importar/exportar tags customizadas
- [ ] Ícones personalizados por tag
- [ ] Cores personalizadas por tag
- [ ] Agrupamento de tags (Frontend/Backend/etc)
- [ ] Estatísticas de uso de tags
- [ ] Tags sugeridas baseadas em projetos similares

## API Reference

### getAllTags()
Retorna todas as tags disponíveis (padrão + customizadas)

```javascript
const tags = getAllTags();
// ['Angular', 'AWS', 'Bootstrap', ...]
```

### addCustomTag(tag)
Adiciona uma nova tag customizada

```javascript
const success = addCustomTag('MinhaTag');
// true se adicionada, false se já existe
```

### searchTags(search)
Busca tags por texto

```javascript
const results = searchTags('node');
// ['Node.js']
```

### isValidTag(tag)
Valida se uma tag é válida

```javascript
isValidTag('React'); // true
isValidTag(''); // false
isValidTag('A'.repeat(100)); // false (muito longa)
```

## Contribuindo

Quer adicionar mais tags padrão? Edite `src/utils/tags.js`:

```javascript
export const DEFAULT_TAGS = [
  // ... tags existentes
  'Sua Nova Tag',
].sort();
```

---

**Nota**: Tags são case-sensitive. "React" é diferente de "react".
