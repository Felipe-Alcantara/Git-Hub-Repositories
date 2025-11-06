# 🚀 Como Executar o Projeto

## ⚠️ Problema com PowerShell?

Se você recebeu erro de "execução de scripts desabilitada", siga uma das opções:

### Opção 1: Usar CMD (Recomendado)
1. Abra o **Prompt de Comando (CMD)** - não o PowerShell
2. Navegue até a pasta do projeto:
   ```cmd
   cd "j:\Programação\GitHub\Repositórios\git-hub-Repositories\Git-Hub-Repositories"
   ```
3. Execute os comandos:
   ```cmd
   npm install
   npm run dev
   ```

### Opção 2: Permitir Scripts no PowerShell
1. Abra o PowerShell **como Administrador**
2. Execute:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Confirme com "S" (Sim)
4. Agora pode executar normalmente:
   ```powershell
   npm install
   npm run dev
   ```

---

## 📦 Passo a Passo Completo

### 1️⃣ Instalar Dependências
```bash
npm install
```
Isso vai instalar:
- React 18
- Vite 5
- Tailwind CSS 3
- React Router
- date-fns
- lucide-react
- Outras dependências...

**Tempo estimado:** 1-2 minutos

### 2️⃣ Executar em Desenvolvimento
```bash
npm run dev
```
Isso vai:
- Iniciar servidor de desenvolvimento
- Abrir em `http://localhost:5173`
- Hot reload automático ao salvar arquivos

**Servidor estará rodando!** 🎉

### 3️⃣ Acessar no Navegador
Abra: `http://localhost:5173/Git-Hub-Repositories/`

Ou aguarde abrir automaticamente!

---

## 🏗️ Build para Produção

Quando quiser fazer o build final:

```bash
npm run build
```

Isso vai:
- Criar pasta `dist/` com arquivos otimizados
- Minificar JS e CSS
- Preparar para deploy

### Preview do Build
```bash
npm run preview
```
Testa o build localmente antes de fazer deploy.

---

## 🚀 Deploy no GitHub Pages

### Configuração Necessária (IMPORTANTE!)

#### 1. Ajustar o `vite.config.js`
Abra o arquivo e **mude a linha do `base`** para o nome do seu repositório:

```js
export default defineConfig({
  plugins: [react()],
  base: '/SEU-REPOSITORIO/', // ⬅️ MUDAR AQUI!
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  }
})
```

**Exemplo:** Se seu repo é `https://github.com/pedro/meus-projetos`
Use: `base: '/meus-projetos/'`

#### 2. Ajustar o `src/App.jsx`
Na linha do `basename` do Router:

```jsx
<Router basename="/SEU-REPOSITORIO"> {/* ⬅️ MUDAR AQUI! */}
```

#### 3. Ativar GitHub Pages

1. Vá em **Settings** do repositório
2. Clique em **Pages** (menu lateral)
3. Em **Source**, selecione: **GitHub Actions**
4. Salve

#### 4. Fazer Push

```bash
git add .
git commit -m "Initial commit: GitHub Projects Dashboard"
git push origin main
```

#### 5. Aguardar Deploy

- Vá em **Actions** no GitHub
- Aguarde o workflow "Deploy to GitHub Pages" terminar
- Acesse: `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`

---

## 📝 Estrutura de Arquivos Criados

```
Git-Hub-Repositories/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions para deploy automático
├── src/
│   ├── components/
│   │   ├── ProjectCard.jsx     # Card visual de projeto
│   │   ├── NewProjectModal.jsx # Modal para criar projeto
│   │   └── ImportExportButtons.jsx # Botões de import/export
│   ├── pages/
│   │   ├── Home.jsx            # Página principal (lista)
│   │   └── ProjectPage.jsx     # Página de detalhes
│   ├── hooks/
│   │   └── useProjects.js      # Hook para gerenciar projetos
│   ├── utils/
│   │   └── storage.js          # Funções de localStorage
│   ├── App.jsx                 # App principal com rotas
│   ├── main.jsx                # Entry point
│   └── index.css               # Estilos globais + Tailwind
├── index.html
├── package.json
├── vite.config.js              # ⚠️ AJUSTAR base!
├── tailwind.config.js
├── postcss.config.js
├── README.md                   # Documentação completa
├── QUICKSTART.md              # Guia rápido
├── example-projects.json       # Projetos de exemplo
└── .gitignore
```

---

## ✅ Checklist de Verificação

Antes de fazer deploy, verifique:

- [ ] `npm install` executou sem erros
- [ ] `npm run dev` funciona localmente
- [ ] Testou criar/editar/deletar projetos
- [ ] Testou import/export
- [ ] Ajustou `base` no `vite.config.js`
- [ ] Ajustou `basename` no `App.jsx`
- [ ] Ativou GitHub Pages → **GitHub Actions**
- [ ] README.md tem suas URLs corretas

---

## 🎯 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm install` | Instala dependências |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Preview do build |

---

## 🐛 Troubleshooting

### "Cannot find package 'react'"
**Solução:** Execute `npm install` novamente

### "Port 5173 already in use"
**Solução:** 
- Feche outros servidores Vite
- Ou use porta diferente: `npm run dev -- --port 3000`

### "404 depois de deploy"
**Solução:** 
- Verifique se o `base` no `vite.config.js` está correto
- Deve ser `/NOME-DO-REPO/` (com barras)

### "Rotas não funcionam no Pages"
**Solução:**
- Verifique o `basename` no `App.jsx`
- Deve corresponder ao nome do repositório

---

## 📚 Próximos Passos

1. ✅ Execute localmente (`npm run dev`)
2. ✅ Crie alguns projetos de teste
3. ✅ Importe o `example-projects.json`
4. ✅ Ajuste configurações para seu repositório
5. ✅ Faça o deploy!
6. ✅ Compartilhe com amigos!

---

**Divirta-se organizando seus projetos! 🚀**
