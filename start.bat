@echo off
echo 🚀 啟動 FlowBuilder...

start "FlowBuilder Backend" cmd /k "npm start"
timeout /t 3 /nobreak >nul
start "FlowBuilder Frontend" cmd /k "cd client && npm start"

echo ✅ FlowBuilder 已啟動！
echo 前端: http://localhost:3000  
echo 後端: http://localhost:3001