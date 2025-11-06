@echo off
echo ================================================
echo   GitHub Projects Dashboard - Setup Inicial
echo ================================================
echo.

REM Verificar se está no diretório correto
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo Certifique-se de executar este script na pasta raiz do projeto.
    pause
    exit /b 1
)

echo [1/5] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas!
echo.

echo [2/5] Testando build...
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha no build!
    pause
    exit /b 1
)
echo [OK] Build realizado com sucesso!
echo.

echo [3/5] Inicializando repositorio Git...
if not exist ".git" (
    git init
    echo [OK] Repositorio Git inicializado!
) else (
    echo [INFO] Repositorio Git ja existe.
)
echo.

echo [4/5] Adicionando arquivos...
git add .
echo [OK] Arquivos adicionados!
echo.

echo [5/5] Criando commit inicial...
git commit -m "feat: GitHub Projects Dashboard - versao inicial

- Interface visual com React + Vite + Tailwind
- CRUD completo de projetos
- 3 visualizacoes: Grid, Lista, Kanban
- Filtros e busca avancada
- Pagina de detalhes com 8 secoes
- Import/Export de projetos (JSON)
- Storage local (localStorage)
- GitHub Pages ready
- Workflow de deploy automatico"

if errorlevel 1 (
    echo [INFO] Commit ja existe ou nada para commitar.
) else (
    echo [OK] Commit criado!
)
echo.

echo ================================================
echo   Setup Concluido!
echo ================================================
echo.
echo Proximos passos:
echo.
echo 1. Configure o repositorio remoto:
echo    git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
echo.
echo 2. IMPORTANTE: Edite antes de fazer push:
echo    - vite.config.js (linha 'base')
echo    - src/App.jsx (linha 'basename')
echo    - README.md (substitua YOUR_USERNAME)
echo.
echo 3. Faca o push:
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Ative GitHub Pages:
echo    Settings -^> Pages -^> Source: GitHub Actions
echo.
echo 5. Aguarde o deploy e acesse:
echo    https://SEU-USUARIO.github.io/SEU-REPO/
echo.
echo ================================================
echo Para testar localmente agora:
echo    npm run dev
echo ================================================
pause
