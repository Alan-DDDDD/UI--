# 🧹 專案清理計劃

## 需要移除的檔案

### 1. 重複的部署配置 (選擇一個主要平台)
- `railway.json` - Railway 部署
- `render.yaml` - Render 部署  
- `vercel.json` - Vercel 部署
- **建議保留**: GitHub Pages (免費且穩定)

### 2. 過多的測試檔案
- `test-debug.js`
- `test-if-else-branch.js` 
- `test-if-node.js`
- `test-if-ui.html`
- `test-runner.js`
- `run-tests.bat`
- `run-tests.sh`
- `client/src/test-manual.js`
- **保留**: `tests/` 目錄下的正式測試

### 3. 重複的文檔檔案
- `README-DEPLOY.md`
- `README-TESTING.md`
- `TESTING_SUMMARY.md`
- `FEATURE_VERIFICATION.md`
- `MANUAL_FEATURE.md`
- `SMART_HINTS_QUICK_ACTIONS.md`
- `SMART_HINTS_TOGGLE.md`
- `condition-branch-solution.md`
- `IF-ELSE-USAGE.md`
- `retry-mechanism-example.js`
- `測試範例.md`
- **保留**: 主要的 `README.md` 和 `CHANGELOG.md`

### 4. 不必要的批次檔案
- `deploy.bat`
- `start.bat`

## 建議的最終結構

```
FlowBuilder/
├── .github/workflows/deploy.yml  # GitHub Pages 部署
├── api/                          # API 路由
├── client/                       # React 前端
├── data/                         # 資料儲存
├── tests/                        # 正式測試套件
├── .gitignore
├── package.json
├── server.js
├── README.md
└── CHANGELOG.md
```

## 清理後的好處
- 減少專案複雜度
- 避免部署配置衝突
- 提高維護效率
- 清晰的專案結構