# IF條件分支解決方案

## 問題描述
目前的條件節點只能往後連接一個節點，無法實現真正的IF-ELSE分支邏輯。

## 解決方案

### 1. 修改節點結構
為條件節點添加多個輸出端點：
- TRUE端點：條件成立時執行的路徑
- FALSE端點：條件不成立時執行的路徑

### 2. 修改執行引擎
在server.js中修改執行邏輯，支援條件分支：

```javascript
// 在executeNode函數中修改condition和if-condition的處理
case 'condition':
case 'if-condition':
  // ... 現有的條件判斷邏輯 ...
  
  // 返回結果時添加分支信息
  return { 
    success: true, 
    data: finalResult,
    branch: finalResult ? 'true' : 'false' // 添加分支信息
  };
```

### 3. 修改流程執行邏輯
在執行工作流程時，根據條件結果選擇不同的執行路徑：

```javascript
// 在執行流程時處理條件分支
for (const node of workflow.nodes) {
  const result = await executeNode(node, context);
  
  if (node.data.type === 'condition' || node.data.type === 'if-condition') {
    // 根據條件結果選擇下一個節點
    const nextEdges = workflow.edges.filter(edge => 
      edge.source === node.id && 
      edge.data?.active !== false
    );
    
    // 找到對應分支的邊
    const branchEdge = nextEdges.find(edge => 
      edge.data?.branch === result.branch || 
      (!edge.data?.branch && result.branch === 'true') // 預設為true分支
    );
    
    if (branchEdge) {
      const nextNode = workflow.nodes.find(n => n.id === branchEdge.target);
      // 執行對應分支的節點
    }
  }
}
```

### 4. 修改前端UI
在App.js中為條件節點添加多個連接點：

```javascript
// 修改條件節點的預設配置
const defaultData = {
  'condition': { 
    label: '條件判斷', 
    field: '{message}', 
    operator: 'contains', 
    value: '你好',
    outputs: ['true', 'false'] // 添加輸出端點
  },
  'if-condition': {
    label: 'IF條件',
    conditions: [],
    logic: 'AND',
    outputs: ['true', 'false'] // 添加輸出端點
  }
};
```

### 5. 修改邊的標記
為邊添加分支標記，讓用戶可以指定哪條邊是TRUE分支，哪條是FALSE分支：

```javascript
// 在邊的右鍵選單中添加分支設定
const onEdgeContextMenu = useCallback((event, edge) => {
  // ... 現有代碼 ...
  
  // 添加分支設定選項
  const branchBtn = document.createElement('button');
  branchBtn.textContent = edge.data?.branch === 'false' ? '🔴 FALSE分支' : '🟢 TRUE分支';
  branchBtn.onclick = () => {
    setEdges((eds) => eds.map((e) => 
      e.id === edge.id 
        ? { 
            ...e, 
            data: { 
              ...e.data, 
              branch: e.data?.branch === 'false' ? 'true' : 'false' 
            },
            label: e.data?.branch === 'false' ? 'TRUE' : 'FALSE'
          }
        : e
    ));
  };
}, [setEdges]);
```

## 實施步驟

1. **修改執行引擎** - 在server.js中添加分支邏輯
2. **修改前端UI** - 為條件節點添加分支標記功能
3. **更新節點編輯器** - 讓用戶可以設定分支條件
4. **測試驗證** - 確保IF-ELSE邏輯正確運作

## 預期效果

實施後，用戶可以：
- 從條件節點拖出兩條線
- 為每條線設定TRUE/FALSE分支
- 根據條件結果自動執行對應分支
- 實現真正的IF-ELSE邏輯流程