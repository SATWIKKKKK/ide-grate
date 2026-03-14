@echo off
cd /d "c:\Users\KIIT\ide-grate"

echo ===== Step 1: Build VS Code Extension =====
cd vscode-extension
call npm run compile
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: VS Code extension build failed!
    pause
    exit /b 1
)
echo VS Code extension built successfully.
echo.

echo ===== Step 2: Package VS Code Extension (.vsix) =====
call npx vsce package --no-dependencies
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: vsce package failed. Install with: npm i -g @vscode/vsce
    echo Continuing with deployment...
)
echo.

cd /d "c:\Users\KIIT\ide-grate"

echo ===== Step 3: Build Next.js App =====
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Next.js build failed!
    pause
    exit /b 1
)
echo Next.js app built successfully.
echo.

echo ===== Step 4: Set Vercel Environment Variables =====
node set-vercel-env.js
echo.

echo ===== Step 5: Deploy to Vercel =====
call npx vercel --prod
echo.

echo ===== DONE =====
echo Deployment complete!
pause
