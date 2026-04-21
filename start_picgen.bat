@echo off
setlocal
set "ROOT=%~dp0"

echo Starting PicGen backend on http://127.0.0.1:8000 ...
start "PicGen Backend" cmd /k "cd /d "%ROOT%backend" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo Starting PicGen frontend on http://127.0.0.1:5173 ...
start "PicGen Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 2 >nul
start "" "http://127.0.0.1:5173"

echo Done. Keep both terminal windows open while using the app.
endlocal
