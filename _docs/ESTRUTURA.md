# 📁 Estrutura do Projeto

```
Git-Hub-Repositories/
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── deploy.yml              # ⚙️ GitHub Actions - Deploy automático
│
├── 📁 src/
│   ├── 📁 components/              # 🧩 Componentes React reutilizáveis
│   │   ├── ProjectCard.jsx         #   └─ Card visual de projeto (home)
│   │   ├── NewProjectModal.jsx     #   └─ Modal para criar/editar
│   │   └── ImportExportButtons.jsx #   └─ Botões import/export JSON
│   │
│   ├── 📁 pages/                   # 📄 Páginas principais
│   │   ├── Home.jsx                #   └─ Dashboard principal (lista)
│   │   └── ProjectPage.jsx         #   └─ Detalhes completos do projeto
│   │
│   ├── 📁 hooks/                   # 🪝 Custom React Hooks
│   │   └── useProjects.js          #   └─ Gerenciar estado de projetos
│   │
│   ├── 📁 utils/                   # 🛠️ Funções utilitárias
│   │   └── storage.js              #   └─ localStorage CRUD + import/export
│   │
│   ├── App.jsx                     # 🎯 Componente raiz + rotas
│   ├── main.jsx                    # 🚀 Entry point da aplicação
│   └── index.css                   # 🎨 Estilos globais + Tailwind
│
├── 📄 index.html                   # 🌐 HTML base
│
├── ⚙️ package.json                 # 📦 Dependências e scripts
├── ⚙️ vite.config.js               # ⚡ Configuração Vite (AJUSTAR!)
├── ⚙️ tailwind.config.js           # 🎨 Configuração Tailwind
├── ⚙️ postcss.config.js            # 🎨 PostCSS para Tailwind
│
├── 📚 README.md                    # 📖 Documentação principal
├── 📚 QUICKSTART.md                # 🚀 Guia de início rápido
├── 📚 EXECUTAR.md                  # 💻 Como executar localmente
├── 📚 CONFIGURACAO.md              # ⚙️ Personalizações
│
├── 📊 example-projects.json        # 📝 Projetos de exemplo
├── 🔧 setup.bat                    # 🤖 Script de instalação (Windows)
│
└── .gitignore                      # 🚫 Arquivos ignorados pelo Git
```

---

## 🎯 Arquivos Importantes

### 🔥 DEVEM SER EDITADOS

| Arquivo | O que fazer | Prioridade |
|---------|-------------|------------|
| `vite.config.js` | Mudar `base: '/SEU-REPO/'` | 🔴 CRÍTICO |
| `src/App.jsx` | Mudar `basename="/SEU-REPO"` | 🔴 CRÍTICO |
| `README.md` | Substituir `YOUR_USERNAME` | 🟡 Importante |

### 📝 Podem ser editados

| Arquivo | O que personalizar | Opcional |
|---------|-------------------|----------|
| `index.html` | Título, SEO, favicon | 🟢 Sim |
| `tailwind.config.js` | Cores do tema | 🟢 Sim |
| `src/pages/Home.jsx` | Título da página | 🟢 Sim |

### ✅ Não precisa mexer

| Arquivo | Descrição |
|---------|-----------|
| `.github/workflows/deploy.yml` | Já configurado para deploy |
| `src/utils/storage.js` | Lógica de localStorage pronta |
| `src/hooks/useProjects.js` | Hook funcional |
| `postcss.config.js` | Config padrão do Tailwind |

---

## 🗂️ Organização por Funcionalidade

### 1️⃣ Interface Visual (UI)
```
src/components/ProjectCard.jsx       # Card de projeto
src/pages/Home.jsx                   # Lista e visualizações
src/pages/ProjectPage.jsx            # Página de detalhes
src/index.css                        # Estilos
tailwind.config.js                   # Tema
```

### 2️⃣ Lógica de Dados
```
src/utils/storage.js                 # localStorage
src/hooks/useProjects.js             # Estado React
```

### 3️⃣ Navegação
```
src/App.jsx                          # React Router
```

### 4️⃣ Import/Export
```
src/components/ImportExportButtons.jsx  # UI
src/utils/storage.js                    # Lógica (exportProjects, importProjects)
example-projects.json                   # Exemplos
```

### 5️⃣ Deploy
```
.github/workflows/deploy.yml         # GitHub Actions
vite.config.js                       # Config de build
```

### 6️⃣ Documentação
```
README.md                            # Overview
QUICKSTART.md                        # Tutorial rápido
EXECUTAR.md                          # Como rodar
CONFIGURACAO.md                      # Personalizações
```

---

## 📊 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│                   USUÁRIO                        │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              COMPONENTES (UI)                    │
│  ├─ ProjectCard.jsx                             │
│  ├─ NewProjectModal.jsx                         │
│  └─ ImportExportButtons.jsx                     │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│            HOOKS (Estado)                        │
│  └─ useProjects.js                              │
│     ├─ projects[]                               │
│     ├─ addProject()                             │
│     ├─ updateProject()                          │
│     └─ deleteProject()                          │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         UTILS (Persistência)                     │
│  └─ storage.js                                  │
│     ├─ getProjects()                            │
│     ├─ saveProjects()                           │
│     ├─ exportProjects()                         │
│     └─ importProjects()                         │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│           localStorage                           │
│  (Navegador do usuário)                         │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Vida

### Primeiro Acesso
```
1. Usuário acessa URL
2. React carrega
3. useProjects → getProjects()
4. localStorage vazio → []
5. Renderiza tela vazia
```

### Criar Projeto
```
1. Usuário clica "Novo Projeto"
2. Modal abre (NewProjectModal)
3. Preenche formulário
4. onSave → addProject()
5. storage.addProject() → localStorage
6. Estado atualiza → Re-render
7. Card aparece na tela
```

### Editar Projeto
```
1. Usuário clica "Ver detalhes"
2. Navega para /project/:id
3. ProjectPage carrega dados
4. Edita campos
5. Salva → updateProject()
6. localStorage atualizado
```

### Export/Import
```
Export:
1. Click "Exportar"
2. storage.exportProjects()
3. JSON.stringify(projects)
4. Blob → Download

Import:
1. Click "Importar"
2. Seleciona arquivo
3. FileReader lê JSON
4. Valida estrutura
5. Adiciona ao localStorage
6. Recarrega página
```

---

## 📦 Tamanho dos Arquivos (Aproximado)

```
src/pages/Home.jsx                 ~8 KB   (maior arquivo)
src/pages/ProjectPage.jsx          ~7 KB
src/utils/storage.js               ~4 KB
src/components/ProjectCard.jsx     ~3 KB
src/components/NewProjectModal.jsx ~3 KB
```

**Total:** ~150 linhas por componente em média

---

## 🚀 Build Output

Após `npm run build`, a pasta `dist/` conterá:

```
dist/
├── index.html                      # HTML otimizado
├── assets/
│   ├── index-[hash].js            # JavaScript minificado
│   ├── index-[hash].css           # CSS minificado
│   └── ...
└── vite.svg                       # Favicon
```

**Tamanho típico:** ~200-300 KB (gzipped)

---

## 🎓 Tecnologias por Arquivo

| Arquivo | Tecnologias |
|---------|-------------|
| `*.jsx` | React, JSX, JavaScript ES6+ |
| `*.css` | Tailwind CSS, CSS3 |
| `vite.config.js` | Vite, JavaScript |
| `tailwind.config.js` | Tailwind, JavaScript |
| `*.json` | JSON |
| `deploy.yml` | YAML, GitHub Actions |

---

**Estrutura limpa e organizada! 🎉**
