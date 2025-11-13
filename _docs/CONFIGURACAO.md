# ⚙️ Configuração Personalizada

Este arquivo contém todas as personalizações que você DEVE fazer antes do deploy.

---

## 🔧 Configurações OBRIGATÓRIAS

### 1. Nome do Repositório

Você precisa configurar o nome do seu repositório em **2 lugares**:

#### 📁 `vite.config.js`
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/Git-Hub-Repositories/', // ⬅️ MUDE AQUI!
  // ...
})
```

**Trocar `Git-Hub-Repositories` pelo nome do SEU repositório**

Exemplos:
- Se repo for `meus-projetos` → `base: '/meus-projetos/'`
- Se repo for `project-dashboard` → `base: '/project-dashboard/'`

⚠️ **IMPORTANTE:** Mantenha as barras `/` no início e fim!

---

#### 📁 `src/App.jsx`
```javascript
<Router basename="/Git-Hub-Repositories"> {/* ⬅️ MUDE AQUI! */}
  {/* ... */}
</Router>
```

**Use o MESMO nome que usou no `vite.config.js`**

---

### 2. README URLs

Abra o `README.md` e substitua em TODOS os lugares:

#### Encontrar:
```
YOUR_USERNAME
```

#### Substituir por:
```
seu-usuario-github
```

**Locais para mudar:**
1. Badge do deploy status
2. Badge do demo live
3. Link do demo
4. Links de como usar
5. Comandos de git clone

**Exemplo:**
```markdown
# Antes
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://YOUR_USERNAME.github.io/Git-Hub-Repositories/)

# Depois
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://pedro-dev.github.io/meus-projetos/)
```

---

## 🎨 Personalizações OPCIONAIS

### 3. Título do Site

#### 📁 `index.html`
```html
<title>GitHub Projects Dashboard</title>
```

Troque por:
- "Meus Projetos"
- "Dashboard de Projetos"
- "Project Manager"
- Ou qualquer outro nome!

---

#### 📁 `src/pages/Home.jsx`
```javascript
<h1 className="text-3xl font-bold text-white">Meus Projetos</h1>
```

---

### 4. Cores do Tema

#### 📁 `tailwind.config.js`

Você pode personalizar as cores escuras:

```javascript
theme: {
  extend: {
    colors: {
      dark: {
        bg: '#0d1117',      // Fundo principal
        surface: '#161b22', // Cards e painéis
        border: '#30363d',  // Bordas
        hover: '#21262d',   // Hover state
      }
    }
  },
}
```

**Exemplos de temas:**

#### Tema Azul Escuro
```javascript
dark: {
  bg: '#0a0e27',
  surface: '#1a1f3a',
  border: '#2d3561',
  hover: '#252b4d',
}
```

#### Tema Roxo
```javascript
dark: {
  bg: '#0f0820',
  surface: '#1a0f2e',
  border: '#2d1b4e',
  hover: '#251940',
}
```

#### Tema Cinza Neutro
```javascript
dark: {
  bg: '#1a1a1a',
  surface: '#242424',
  border: '#3a3a3a',
  hover: '#2e2e2e',
}
```

---

### 5. Favicon

Substitua o arquivo no caminho:
```
public/vite.svg
```

Por sua própria logo (recomendado: SVG ou PNG 32x32)

Depois atualize no `index.html`:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

---

### 6. Metadados SEO

#### 📁 `index.html`

Personalize a descrição:
```html
<meta name="description" content="Sua descrição personalizada aqui" />
<meta name="author" content="Seu Nome" />
<meta name="keywords" content="github, projetos, dashboard, portfolio" />

<!-- Open Graph (para redes sociais) -->
<meta property="og:title" content="Meus Projetos GitHub" />
<meta property="og:description" content="Dashboard visual dos meus projetos" />
<meta property="og:image" content="URL_DA_SUA_IMAGEM" />
<meta property="og:url" content="https://seu-usuario.github.io/seu-repo/" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Meus Projetos GitHub" />
<meta name="twitter:description" content="Dashboard visual dos meus projetos" />
```

---

## 🔐 Configurações de Privacidade

### 7. Analytics (Opcional)

Se quiser adicionar Google Analytics ou similar, adicione no `index.html`:

```html
<head>
  <!-- ... outros meta tags ... -->
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  </script>
</head>
```

---

## 🚀 GitHub Pages Setup

### 8. Habilitar GitHub Pages

1. Vá em **Settings** do repositório
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione: **GitHub Actions**
4. Clique em **Save**

Pronto! O workflow `.github/workflows/deploy.yml` já está configurado.

---

### 9. Domínio Customizado (Avançado)

Se você tem um domínio próprio:

1. No GitHub Settings → Pages
2. Em **Custom domain**, adicione: `www.seudominio.com`
3. Configure DNS no seu provedor:
   ```
   Type: CNAME
   Name: www
   Value: seu-usuario.github.io
   ```

4. Atualize o `vite.config.js`:
   ```javascript
   base: '/', // Sem subpasta para domínio próprio
   ```

---

## 📊 Configurações Avançadas

### 10. Limites de localStorage

Por padrão, o localStorage tem ~5MB. Se você planeja ter MUITOS projetos:

#### 📁 `src/utils/storage.js`

Adicione compressão ou considere usar IndexedDB:

```javascript
// Exemplo: avisar quando próximo do limite
const checkStorageLimit = () => {
  let total = 0;
  for(let key in localStorage) {
    if(localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length;
    }
  }
  const usedMB = (total / 1024 / 1024).toFixed(2);
  
  if(usedMB > 4) {
    console.warn(`⚠️ localStorage usando ${usedMB}MB de ~5MB`);
  }
};
```

---

### 11. Número de Projetos por Página

Se quiser adicionar paginação futuramente:

#### 📁 `src/pages/Home.jsx`

```javascript
const PROJECTS_PER_PAGE = 20; // Adicionar no topo

// Implementar lógica de paginação
```

---

## ✅ Checklist Final

Antes de fazer commit, verifique:

### Obrigatório
- [ ] ✅ `vite.config.js` → `base` com nome do repositório
- [ ] ✅ `src/App.jsx` → `basename` com nome do repositório
- [ ] ✅ `README.md` → Substituiu `YOUR_USERNAME`
- [ ] ✅ `index.html` → Título personalizado
- [ ] ✅ GitHub Pages ativado como **GitHub Actions**

### Opcional
- [ ] 🎨 Cores personalizadas no `tailwind.config.js`
- [ ] 🖼️ Favicon customizado
- [ ] 📝 Metadados SEO atualizados
- [ ] 📊 Analytics configurado (se desejado)
- [ ] 🌐 Domínio customizado (se tiver)

---

## 🎯 Comandos de Teste

Antes de fazer deploy, teste localmente:

```bash
# 1. Build
npm run build

# 2. Preview (simula produção)
npm run preview

# 3. Acesse e teste tudo
# http://localhost:4173/SEU-REPO/
```

Se funcionar no preview, funcionará no Pages! ✅

---

## 📚 Arquivos de Configuração

Resumo dos arquivos que você pode editar:

| Arquivo | O que configurar |
|---------|------------------|
| `vite.config.js` | Nome do repo (base) |
| `src/App.jsx` | Nome do repo (basename) |
| `tailwind.config.js` | Cores do tema |
| `index.html` | Título, SEO, favicon |
| `README.md` | URLs, usuário GitHub |
| `package.json` | Nome, descrição, versão |

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. Verifique o console do navegador (F12)
2. Veja os logs do GitHub Actions
3. Compare com este checklist
4. Abra uma issue no GitHub

---

**Boa configuração! 🎉**
