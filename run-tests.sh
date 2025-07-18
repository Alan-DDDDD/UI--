#!/bin/bash

# FlowBuilder 測試執行腳本 (Linux/macOS)

set -e  # 遇到錯誤時退出

echo "========================================"
echo "FlowBuilder 測試執行腳本"
echo "========================================"

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "錯誤: 未找到 Node.js，請先安裝 Node.js"
    exit 1
fi

# 檢查 npm 是否安裝
if ! command -v npm &> /dev/null; then
    echo "錯誤: 未找到 npm，請確認 Node.js 安裝正確"
    exit 1
fi

echo "檢查依賴..."

# 安裝後端依賴
if [ ! -d "node_modules" ]; then
    echo "安裝後端依賴..."
    npm install
fi

# 安裝前端依賴
if [ ! -d "client/node_modules" ]; then
    echo "安裝前端依賴..."
    cd client
    npm install
    cd ..
fi

# 解析命令行參數
TEST_TYPE=${1:-all}

echo ""
echo "執行測試類型: $TEST_TYPE"
echo ""

# 根據參數執行不同的測試
case $TEST_TYPE in
    "all")
        echo "執行完整測試套件..."
        node test-runner.js
        ;;
    "server")
        echo "執行後端測試..."
        npm run test:server
        ;;
    "client")
        echo "執行前端測試..."
        npm run test:client
        ;;
    "e2e")
        echo "執行 E2E 測試..."
        npm run test:e2e
        ;;
    "coverage")
        echo "生成測試覆蓋率報告..."
        npm run test:coverage
        ;;
    *)
        echo "未知的測試類型: $TEST_TYPE"
        echo ""
        echo "可用的測試類型:"
        echo "  all      - 執行所有測試 (預設)"
        echo "  server   - 只執行後端測試"
        echo "  client   - 只執行前端測試"
        echo "  e2e      - 只執行 E2E 測試"
        echo "  coverage - 生成測試覆蓋率報告"
        echo ""
        echo "使用方式: ./run-tests.sh [測試類型]"
        echo "範例: ./run-tests.sh server"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "測試執行完成"
echo "========================================"