# 🔧 Troubleshooting - Soluções de Problemas

Guia completo de resolução de problemas comuns.

---

## 📋 Índice Rápido

1. [Problemas de Instalação](#problemas-de-instalação)
2. [Problemas de Build](#problemas-de-build)
3. [Problemas de Deploy](#problemas-de-deploy)
4. [Problemas de Navegação](#problemas-de-navegação)
5. [Problemas de Storage](#problemas-de-storage)
6. [Problemas de Import/Export](#problemas-de-importexport)
7. [Erros Comuns](#erros-comuns)

---

## 🚨 Problemas de Instalação

### ❌ "npm não é reconhecido"
**Causa:** Node.js não instalado ou não está no PATH

**Solução:**
1. Baixe Node.js: https://nodejs.org
2. Instale a versão LTS
3. Reinicie o terminal
4. Teste: `node --version` e `npm --version`

---

### ❌ "Execução de scripts desabilitada" (PowerShell)
**Causa:** Política de execução do PowerShell

**Solução 1 - Use CMD:**
```cmd
# Abra o Prompt de Comando (não PowerShell)
cd "caminho\do\projeto"
npm install
```

**Solução 2 - Libere o PowerShell:**
```powershell
# Execute como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### ❌ "EACCES: permission denied"
**Causa:** Permissões insuficientes

**Solução:**
```bash
# Windows: Execute terminal como Administrador

# Linux/Mac:
sudo npm install -g npm@latest
# OU use nvm para gerenciar Node.js
```

---

### ❌ "Cannot find module 'react'"
**Causa:** Dependências não instaladas

**Solução:**
```bash
# Delete node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstale
npm install
```

---

## 🏗️ Problemas de Build

### ❌ "Failed to parse source for import analysis"
**Causa:** Erro de sintaxe em algum arquivo

**Solução:**
1. Verifique o console para ver qual arquivo
2. Procure por:
   - Importações incompletas
   - Fechamento de tags JSX
   - Vírgulas/ponto-e-vírgulas faltando

---

### ❌ "Cannot read properties of undefined"
**Causa:** Acessando propriedade de objeto undefined

**Solução:**
```javascript
// ❌ Errado
project.details.ideas

// ✅ Correto
project?.details?.ideas || ''
```

---

### ❌ "React is not defined"
**Causa:** Faltou importar React (em versões antigas)

**Solução:**
```javascript
// Adicione no topo do arquivo
import React from 'react';
```

**Nota:** React 17+ não precisa dessa importação para JSX

---

### ❌ Build falha com "out of memory"
**Causa:** Node.js ficou sem memória

**Solução:**
```bash
# Aumentar limite de memória
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

---

## 🚀 Problemas de Deploy

### ❌ Página 404 após deploy
**Causa:** Base path incorreto

**Solução:**

**1. Verifique `vite.config.js`:**
```javascript
base: '/NOME-DO-REPO/', // Deve ter as barras!
```

**2. Verifique `src/App.jsx`:**
```javascript
<Router basename="/NOME-DO-REPO">
```

**3. Nome deve ser EXATAMENTE igual ao repositório**

---

### ❌ "404 - File not found" ao acessar rotas
**Causa:** GitHub Pages não suporta SPA routing por padrão

**Solução está implementada:** O projeto usa hash routing através do basename

**Se continuar com problema:**
```javascript
// src/App.jsx
// Use HashRouter ao invés de BrowserRouter
import { HashRouter as Router } from 'react-router-dom';
```

---

### ❌ GitHub Actions falha no deploy
**Causa:** Várias possíveis

**Checklist:**
1. ✅ GitHub Pages está ativado?
2. ✅ Source está em "GitHub Actions"?
3. ✅ Workflow `.github/workflows/deploy.yml` existe?
4. ✅ Branch é `main` (não `master`)?

**Ver logs:**
1. Vá em **Actions** no GitHub
2. Clique no workflow que falhou
3. Leia os erros

---

### ❌ "Permission denied" no workflow
**Causa:** Permissões do workflow

**Solução:**
1. Settings → Actions → General
2. Workflow permissions
3. Selecione "Read and write permissions"
4. Salve

---

### ❌ Site não atualiza após push
**Causa:** Cache do navegador ou GitHub

**Solução:**
1. Limpe cache do navegador (Ctrl+Shift+R)
2. Aguarde 2-5 minutos
3. Verifique workflow concluiu
4. Acesse em aba anônima

---

## 🧭 Problemas de Navegação

### ❌ Links não funcionam
**Causa:** Basename incorreto no Router

**Solução:**
```javascript
// src/App.jsx
<Router basename="/NOME-DO-REPO">
  {/* rotas */}
</Router>
```

---

### ❌ "Cannot read property 'id' of undefined"
**Causa:** Tentando acessar projeto que não existe

**Solução em `src/pages/ProjectPage.jsx`:**
```javascript
useEffect(() => {
  const loadedProject = getProjectById(id);
  if (!loadedProject) {
    navigate('/'); // Redireciona se não existir
    return;
  }
  setProject(loadedProject);
}, [id, navigate]);
```

**Já implementado!** ✅

---

## 💾 Problemas de Storage

### ❌ "QuotaExceededError"
**Causa:** localStorage cheio (~5MB limite)

**Solução:**
```javascript
// Verificar uso
let total = 0;
for(let key in localStorage) {
  if(localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length;
  }
}
console.log('Storage usado:', (total / 1024 / 1024).toFixed(2), 'MB');

// Se necessário, limpe projetos antigos ou exporte e limpe
```

---

### ❌ Dados sumiram
**Causa:** localStorage foi limpo

**Possíveis causas:**
1. Limpou cache do navegador
2. Modo anônimo (não persiste)
3. Outro navegador
4. Outro dispositivo

**Prevenção:**
- ⚠️ Exporte regularmente!
- Use sempre o mesmo navegador
- Não use modo anônimo

**Recuperação:**
- Importe o último backup exportado

---

### ❌ "Unexpected token" ao carregar dados
**Causa:** localStorage corrompido

**Solução:**
```javascript
// Abra o console (F12) e execute:
localStorage.removeItem('github_projects_dashboard');
location.reload();
```

---

## 📦 Problemas de Import/Export

### ❌ Importar não funciona
**Causa:** Arquivo JSON inválido

**Solução:**
1. Valide o JSON: https://jsonlint.com
2. Verifique se é um array: `[...]`
3. Estrutura deve ter campos obrigatórios:
```json
[
  {
    "id": "string",
    "name": "string",
    "createdAt": "ISO date",
    "details": {}
  }
]
```

---

### ❌ Projetos duplicados ao importar
**Causa:** Importou o mesmo arquivo 2x

**Solução:**
- Import adiciona, não substitui
- Delete duplicatas manualmente
- Ou limpe e importe novamente

---

### ❌ Export não baixa arquivo
**Causa:** Popup blocker ou erro JS

**Solução:**
1. Verifique console (F12) para erros
2. Permita popups/downloads do site
3. Tente em outro navegador

---

## ⚠️ Erros Comuns

### ❌ "Hydration failed"
**Causa:** Diferença entre server/client render

**Solução:**
- Não aplicável (projeto é 100% client-side)
- Se ver isso, pode ser extensão do navegador

---

### ❌ "Maximum update depth exceeded"
**Causa:** Loop infinito de updates

**Solução:**
```javascript
// ❌ Errado - causa loop
useEffect(() => {
  setProject(getProjectById(id));
}); // Sem dependências!

// ✅ Correto
useEffect(() => {
  setProject(getProjectById(id));
}, [id]); // Com dependências
```

---

### ❌ Estilos não aplicam
**Causa:** Tailwind não compilou

**Solução:**
```bash
# Reinstale Tailwind
npm install -D tailwindcss postcss autoprefixer

# Rebuide
npm run dev
```

---

### ❌ "Failed to fetch dynamically imported module"
**Causa:** Build antigo em cache

**Solução:**
1. Ctrl+Shift+R (hard refresh)
2. Limpe cache do navegador
3. Rebuilde: `npm run build`

---

## 🔍 Debugging

### Ver Dados do localStorage

```javascript
// Console (F12)
console.log(
  JSON.parse(
    localStorage.getItem('github_projects_dashboard')
  )
);
```

---

### Limpar Tudo e Recomeçar

```javascript
// Console (F12)
localStorage.clear();
location.reload();
```

---

### Verificar Versão do Node

```bash
node --version  # Deve ser v18 ou superior
npm --version   # Deve ser v9 ou superior
```

---

## 📞 Ainda com Problemas?

### 1. Checklist Geral
- [ ] Node.js v18+ instalado?
- [ ] `npm install` rodou sem erros?
- [ ] `npm run build` funciona?
- [ ] `vite.config.js` tem base correto?
- [ ] `src/App.jsx` tem basename correto?
- [ ] GitHub Pages ativado com GitHub Actions?

### 2. Informações para Pedir Ajuda

Ao abrir issue, inclua:
- ✅ Versão do Node: `node --version`
- ✅ Sistema operacional
- ✅ Logs de erro completos
- ✅ O que você tentou fazer
- ✅ O que aconteceu
- ✅ O que esperava acontecer

### 3. Logs Úteis

```bash
# Ver logs detalhados do build
npm run build --verbose

# Ver dependências instaladas
npm list --depth=0
```

---

## 🆘 Soluções Rápidas

| Problema | Solução Rápida |
|----------|----------------|
| 404 no Pages | Verifique `base` e `basename` |
| Dados sumiram | Importe último backup |
| Build falha | Delete `node_modules`, reinstale |
| Rotas não funcionam | Verifique basename do Router |
| Import não funciona | Valide JSON em jsonlint.com |
| Slow/travando | Muitos projetos? Exporte e limpe |
| Console cheio de erros | Limpe localStorage e recarregue |

---

## ✅ Verificação Final

Se tudo falhar, tente do zero:

```bash
# 1. Backup
npm run build  # Exporte seus projetos primeiro!

# 2. Limpe tudo
rm -rf node_modules package-lock.json dist

# 3. Reinstale
npm install

# 4. Teste
npm run dev

# 5. Build
npm run build

# 6. Commit e push
git add .
git commit -m "fix: rebuild do zero"
git push
```

---

**Problema resolvido? Ótimo! 🎉**

**Ainda com problema? Abra uma issue no GitHub com detalhes!**
