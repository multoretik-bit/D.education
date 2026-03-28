@echo off
echo =========================================
echo Starting GitHub upload process...
echo =========================================

echo.
echo [1/3] Adding all files to Git...
git add .

echo.
echo [2/3] Committing changes...
git commit -m "Upload all 26 blocks and 530+ lessons"

echo.
echo [3/3] Pushing to GitHub...
git push

echo.
echo =========================================
echo Upload complete! You can close this window.
echo =========================================
pause
