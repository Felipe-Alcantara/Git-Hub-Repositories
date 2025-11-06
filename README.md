# 🚀 GitHub Projects Dashboard

> Dashboard visual e interativo para organizar e gerenciar seus projetos do GitHub localmente no navegador

[![Deploy Status](https://github.com/YOUR_USERNAME/Git-Hub-Repositories/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/YOUR_USERNAME/Git-Hub-Repositories/actions)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://YOUR_USERNAME.github.io/Git-Hub-Repositories/)

## ✨ Funcionalidades

### 📋 Gestão de Projetos
- ✅ Criar, editar e deletar projetos
- ✅ Informações completas: nome, descrição, links, tecnologias
- ✅ Status de conclusão e complexidade
- ✅ Data de criação e última modificação

### 🎨 Visualizações
- **Grade** - Layout em cards para visão geral
- **Lista** - Visualização compacta
- **Kanban** - Organize por status (em andamento, finalizados)

### 🔍 Filtros e Busca
- Busca por nome, descrição ou tecnologias
- Filtrar por complexidade (Simples → Inviável)
- Filtrar por status (Finalizado/Em andamento)
- Ordenar por data, nome ou complexidade

### 📝 Página Detalhada
Cada projeto tem uma página completa com seções:
- 💡 **Ideias** - Brainstorm e conceitos
- ⚡ **Melhorias** - Features planejadas
- 🐛 **Problemas** - Issues conhecidos
- 🎯 **Propósito** - Objetivo do projeto
- 👥 **Usuários** - Público-alvo
- 🚀 **MVP** - Produto mínimo viável
- 🛠️ **Stack** - Tecnologias utilizadas
- 📈 **Upgrades** - Próximas atualizações

### 💾 Import/Export
- Exportar projetos como JSON
- Importar projetos de outros usuários
- Compartilhar configurações facilmente
- Backup completo dos dados

### 🌐 100% Client-Side
- Sem backend necessário
- Dados salvos no localStorage do navegador
- Funciona offline após primeiro acesso
- Deploy estático no GitHub Pages

## 🚀 Como Usar

### Acesso Direto
Basta acessar: **[https://YOUR_USERNAME.github.io/Git-Hub-Repositories/](https://YOUR_USERNAME.github.io/Git-Hub-Repositories/)**

Não precisa clonar nem instalar nada! Abra o link e comece a usar imediatamente.

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/YOUR_USERNAME/Git-Hub-Repositories.git
cd Git-Hub-Repositories

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🛠️ Stack Técnica

- **React 18** - Framework UI
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Estilização
- **React Router** - Navegação
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones
- **localStorage** - Persistência de dados

## 📦 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ProjectCard.jsx
│   ├── NewProjectModal.jsx
│   └── ImportExportButtons.jsx
├── pages/              # Páginas principais
│   ├── Home.jsx
│   └── ProjectPage.jsx
├── hooks/              # React hooks customizados
│   └── useProjects.js
├── utils/              # Utilitários
│   └── storage.js
└── App.jsx             # Componente raiz
```

## 💡 Como Funciona o Import/Export

### Exportar Projetos
1. Clique em "Exportar Projetos"
2. Um arquivo JSON será baixado com todos os seus projetos

### Importar Projetos
1. Clique em "Importar Projetos"
2. Selecione um arquivo JSON exportado
3. Os projetos serão adicionados aos seus existentes (sem sobrescrever)

**Formato do JSON:**
```json
[
  {
    "id": "uuid",
    "name": "Meu Projeto",
    "description": "Descrição do projeto",
    "languages": ["JavaScript", "React"],
    "complexity": "medium",
    "isCompleted": false,
    "details": {
      "ideas": "...",
      "improvements": "...",
      ...
    }
  }
]
```

## 🎯 Casos de Uso

1. **Desenvolvedor Solo**
   - Organize todos os seus projetos pessoais
   - Acompanhe ideias e melhorias
   - Mantenha histórico de decisões

2. **Portfólio**
   - Tenha uma visão clara de todos os projetos
   - Filtre por complexidade para demonstrações
   - Exporte e compartilhe sua lista

3. **Planejamento**
   - Use o Kanban para gerenciar status
   - Defina MVPs e roadmaps
   - Priorize por complexidade

4. **Compartilhamento**
   - Exporte projetos para backup
   - Compartilhe listas com equipe
   - Importe projetos de templates

## 🔒 Privacidade

Todos os dados são armazenados **localmente no seu navegador**. Nada é enviado para servidores externos. Seus projetos são 100% privados e só você tem acesso.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para:
- Reportar bugs
- Sugerir novas features
- Enviar pull requests

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🌟 Features Futuras

- [ ] Drag and drop para reordenar projetos
- [ ] Temas personalizados (dark/light)
- [ ] Tags customizadas
- [ ] Integração com API do GitHub
- [ ] Gráficos e estatísticas
- [ ] Sincronização via Gist

---

Feito com ❤️ para organizar projetos de forma visual e prática!
