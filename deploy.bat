@echo off
echo 🚀 FlowBuilder 部署更新中...

echo 📦 更新依賴...
npm install
cd client && npm install
cd ..

echo 🔨 建置前端...
cd client && npm run build
cd ..

echo ✅ 部署完成！
echo 前端: http://localhost:3000
echo 後端: http://localhost:3001

pause