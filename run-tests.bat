@echo off
echo ========================================
echo FlowBuilder 測試執行腳本
echo ========================================

REM 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: 未找到 Node.js，請先安裝 Node.js
    pause
    exit /b 1
)

REM 檢查 npm 是否安裝
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 錯誤: 未找到 npm，請確認 Node.js 安裝正確
    pause
    exit /b 1
)

echo 檢查依賴...
if not exist node_modules (
    echo 安裝後端依賴...
    call npm install
    if %errorlevel% neq 0 (
        echo 錯誤: 後端依賴安裝失敗
        pause
        exit /b 1
    )
)

if not exist client\node_modules (
    echo 安裝前端依賴...
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo 錯誤: 前端依賴安裝失敗
        pause
        exit /b 1
    )
    cd ..
)

REM 解析命令行參數
set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

echo.
echo 執行測試類型: %TEST_TYPE%
echo.

REM 根據參數執行不同的測試
if "%TEST_TYPE%"=="all" (
    echo 執行完整測試套件...
    node test-runner.js
) else if "%TEST_TYPE%"=="server" (
    echo 執行後端測試...
    call npm run test:server
) else if "%TEST_TYPE%"=="client" (
    echo 執行前端測試...
    call npm run test:client
) else if "%TEST_TYPE%"=="e2e" (
    echo 執行 E2E 測試...
    call npm run test:e2e
) else if "%TEST_TYPE%"=="coverage" (
    echo 生成測試覆蓋率報告...
    call npm run test:coverage
) else (
    echo 未知的測試類型: %TEST_TYPE%
    echo.
    echo 可用的測試類型:
    echo   all      - 執行所有測試 (預設)
    echo   server   - 只執行後端測試
    echo   client   - 只執行前端測試
    echo   e2e      - 只執行 E2E 測試
    echo   coverage - 生成測試覆蓋率報告
    echo.
    echo 使用方式: run-tests.bat [測試類型]
    echo 範例: run-tests.bat server
    pause
    exit /b 1
)

echo.
echo ========================================
echo 測試執行完成
echo ========================================

REM 如果是互動模式，等待用戶按鍵
if "%2"=="--interactive" (
    pause
)