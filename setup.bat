@echo off
echo.
echo  ==========================================
echo    SPRINGCOMPANY — DEPLOYMENT SETUP SCRIPT
echo  ==========================================
echo.

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not installed.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)
echo  [1/6] Node.js detected...

REM Check Git
git -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Git not installed.
    echo  Download from: https://git-scm.com
    pause
    exit /b 1
)
echo  [2/6] Git detected...

REM Install dependencies
echo  [3/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  ERROR: npm install failed.
    pause
    exit /b 1
)
echo  [3/6] Dependencies installed!

REM Create .env if not exists
if not exist .env (
    echo  [4/6] Creating .env file from template...
    copy .env.example .env
    echo.
    echo  IMPORTANT: Open .env and fill in:
    echo  - MONGODB_URI (your Atlas connection string)
    echo  - JWT_SECRET (any 64-char random string)
    echo  - PAYSTACK_SECRET_KEY (from paystack.com)
    echo.
) else (
    echo  [4/6] .env file already exists.
)

REM Create upload folders
echo  [5/6] Creating upload directories...
if not exist uploads mkdir uploads
if not exist uploads\ids mkdir uploads\ids
if not exist uploads\images mkdir uploads\images
if not exist uploads\videos mkdir uploads\videos
echo  [5/6] Upload folders created!

REM Initialize git repo
echo  [6/6] Initializing Git repository...
if not exist .git (
    git init
    git add .
    git commit -m "Springcompany initial commit"
    echo  [6/6] Git initialized!
) else (
    echo  [6/6] Git already initialized.
)

echo.
echo  ==========================================
echo    SETUP COMPLETE!
echo  ==========================================
echo.
echo  Next steps:
echo.
echo  1. Edit .env with your MongoDB URI and keys
echo  2. Run: npm run dev
echo  3. Open: http://localhost:5000
echo  4. Admin dashboard: http://localhost:5000/admin.html
echo.
echo  To deploy to Vercel:
echo  1. Push to GitHub: git push
echo  2. Import on vercel.com
echo  3. Add env variables on Vercel dashboard
echo.
pause
