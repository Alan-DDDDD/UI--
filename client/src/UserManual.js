import React, { useState } from 'react';
import './UserManual.css';

const UserManual = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  const sections = [
    { id: 'overview', title: '系統概覽', icon: '🏠' },
    { id: 'getting-started', title: '快速開始', icon: '🚀' },
    { id: 'interface', title: '介面說明', icon: '🖥️' },
    { id: 'nodes', title: '節點類型', icon: '🔧' },
    { id: 'workflow', title: '流程操作', icon: '⚡' },
    { id: 'execution', title: '執行與測試', icon: '▶️' },
    { id: 'advanced', title: '進階功能', icon: '⚙️' },
    { id: 'troubleshooting', title: '常見問題', icon: '❓' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="manual-content">
            <h2>🏠 系統概覽</h2>
            <div className="content-section">
              <h3>什麼是FlowBuilder？</h3>
              <p>FlowBuilder是一個視覺化的工作流程編輯器，讓您可以透過拖放節點的方式來設計和執行API串接工作流程。無需編寫程式碼，即可建立複雜的自動化流程。</p>
              
              <h3>主要功能特色</h3>
              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">🎨</div>
                  <h4>視覺化編輯</h4>
                  <p>直觀的拖放介面，輕鬆建立流程</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔗</div>
                  <h4>API整合</h4>
                  <p>支援HTTP請求，串接各種外部服務</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h4>條件邏輯</h4>
                  <p>智能條件判斷，實現複雜業務邏輯</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h4>資料轉換</h4>
                  <p>靈活的資料映射和處理功能</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💾</div>
                  <h4>流程管理</h4>
                  <p>儲存、載入和版本管理工作流程</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h4>LINE整合</h4>
                  <p>完整的LINE Bot API支援</p>
                </div>
              </div>

              <h3>適用場景</h3>
              <ul className="scenario-list">
                <li><strong>聊天機器人</strong> - 建立智能對話流程</li>
                <li><strong>API整合</strong> - 串接多個系統和服務</li>
                <li><strong>資料處理</strong> - 自動化資料轉換和處理</li>
                <li><strong>通知系統</strong> - 建立自動化通知流程</li>
                <li><strong>業務流程</strong> - 數位化業務處理流程</li>
              </ul>
            </div>
          </div>
        );

      case 'getting-started':
        return (
          <div className="manual-content">
            <h2>🚀 快速開始</h2>
            <div className="content-section">
              <h3>第一步：建立新流程</h3>
              <div className="step-guide">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>開啟系統</h4>
                    <p>在瀏覽器中訪問 http://localhost:3000</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>建立新流程</h4>
                    <p>點擊左側面板的「新增流程」按鈕</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>設定流程名稱</h4>
                    <p>為您的流程取一個有意義的名稱</p>
                  </div>
                </div>
              </div>

              <h3>第二步：新增節點</h3>
              <div className="step-guide">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>選擇節點類型</h4>
                    <p>從左側節點面板選擇所需的節點類型</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>拖放到畫布</h4>
                    <p>將節點拖放到中央的流程畫布上</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>配置節點</h4>
                    <p>點擊節點開啟設定面板，配置相關參數</p>
                  </div>
                </div>
              </div>

              <h3>第三步：連接節點</h3>
              <div className="step-guide">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>找到連接點</h4>
                    <p>每個節點右側有輸出點，左側有輸入點</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>拖拽連線</h4>
                    <p>從輸出點拖拽到下一個節點的輸入點</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>建立流程</h4>
                    <p>重複連接，建立完整的執行流程</p>
                  </div>
                </div>
              </div>

              <div className="quick-tip">
                <h4>💡 快速提示</h4>
                <p>建議從「程式進入點」節點開始，這是流程的起始點。然後根據需求添加其他節點並連接。</p>
              </div>
            </div>
          </div>
        );

      case 'interface':
        return (
          <div className="manual-content">
            <h2>🖥️ 介面說明</h2>
            <div className="content-section">
              <h3>主要介面區域</h3>
              <div className="interface-diagram">
                <div className="interface-area">
                  <h4>1. 側邊欄 (左側)</h4>
                  <ul>
                    <li><strong>流程管理</strong> - 新增、載入、儲存流程</li>
                    <li><strong>節點面板</strong> - 各種可用的節點類型</li>
                    <li><strong>執行面板</strong> - 測試和執行流程</li>
                  </ul>
                </div>
                <div className="interface-area">
                  <h4>2. 流程畫布 (中央)</h4>
                  <ul>
                    <li><strong>節點顯示</strong> - 視覺化的流程節點</li>
                    <li><strong>連線顯示</strong> - 節點間的執行路徑</li>
                    <li><strong>背景網格</strong> - 協助對齊和定位</li>
                  </ul>
                </div>
                <div className="interface-area">
                  <h4>3. 控制面板 (右下)</h4>
                  <ul>
                    <li><strong>縮放控制</strong> - 放大縮小畫布</li>
                    <li><strong>適應螢幕</strong> - 自動調整視圖</li>
                    <li><strong>全螢幕</strong> - 最大化工作區域</li>
                  </ul>
                </div>
                <div className="interface-area">
                  <h4>4. 節點編輯器 (彈出)</h4>
                  <ul>
                    <li><strong>參數設定</strong> - 配置節點屬性</li>
                    <li><strong>資料映射</strong> - 設定資料流向</li>
                    <li><strong>測試功能</strong> - 單獨測試節點</li>
                  </ul>
                </div>
              </div>

              <h3>側邊欄模式</h3>
              <div className="sidebar-modes">
                <div className="mode-card">
                  <h4>完整模式</h4>
                  <p>顯示所有功能面板，適合詳細編輯</p>
                </div>
                <div className="mode-card">
                  <h4>精簡模式</h4>
                  <p>只顯示基本功能，節省螢幕空間</p>
                </div>
                <div className="mode-card">
                  <h4>隱藏模式</h4>
                  <p>完全隱藏側邊欄，專注於流程設計</p>
                </div>
              </div>

              <h3>快捷鍵</h3>
              <div className="shortcut-table">
                <div className="shortcut-row">
                  <span className="key">右鍵點擊連線</span>
                  <span className="action">連線選單（暫停/啟用/刪除）</span>
                </div>
                <div className="shortcut-row">
                  <span className="key">滾輪</span>
                  <span className="action">縮放畫布</span>
                </div>
                <div className="shortcut-row">
                  <span className="key">拖拽</span>
                  <span className="action">移動節點/畫布</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'nodes':
        return (
          <div className="manual-content">
            <h2>🔧 節點類型</h2>
            <div className="content-section">
              <h3>基礎節點</h3>
              <div className="node-grid">
                <div className="node-card">
                  <div className="node-icon">🚀</div>
                  <h4>程式進入點</h4>
                  <p><strong>用途：</strong>流程的起始點</p>
                  <p><strong>設定：</strong>名稱、描述</p>
                  <p><strong>說明：</strong>每個流程都應該有一個進入點作為開始</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">🌐</div>
                  <h4>HTTP請求</h4>
                  <p><strong>用途：</strong>呼叫外部API</p>
                  <p><strong>設定：</strong>URL、方法、標頭、內容</p>
                  <p><strong>說明：</strong>支援GET、POST、PUT、DELETE等方法</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">🔀</div>
                  <h4>條件判斷</h4>
                  <p><strong>用途：</strong>根據條件分支執行</p>
                  <p><strong>設定：</strong>欄位、運算子、比較值</p>
                  <p><strong>說明：</strong>支援等於、包含、大於等多種判斷</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">🔄</div>
                  <h4>資料映射</h4>
                  <p><strong>用途：</strong>轉換資料格式</p>
                  <p><strong>設定：</strong>來源欄位、目標欄位</p>
                  <p><strong>說明：</strong>將輸入資料轉換為所需格式</p>
                </div>
              </div>

              <h3>LINE Bot節點</h3>
              <div className="node-grid">
                <div className="node-card">
                  <div className="node-icon">💬</div>
                  <h4>LINE回覆</h4>
                  <p><strong>用途：</strong>回覆LINE訊息</p>
                  <p><strong>設定：</strong>回覆Token、訊息內容</p>
                  <p><strong>說明：</strong>用於回應用戶的LINE訊息</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">📤</div>
                  <h4>LINE推送</h4>
                  <p><strong>用途：</strong>主動推送訊息</p>
                  <p><strong>設定：</strong>用戶ID、訊息內容</p>
                  <p><strong>說明：</strong>主動發送訊息給特定用戶</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">🎠</div>
                  <h4>LINE多頁</h4>
                  <p><strong>用途：</strong>發送輪播訊息</p>
                  <p><strong>設定：</strong>多個卡片內容</p>
                  <p><strong>說明：</strong>建立豐富的互動式訊息</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">🎣</div>
                  <h4>Webhook觸發</h4>
                  <p><strong>用途：</strong>接收外部觸發</p>
                  <p><strong>設定：</strong>觸發條件</p>
                  <p><strong>說明：</strong>當收到特定請求時啟動流程</p>
                </div>
              </div>

              <h3>進階節點</h3>
              <div className="node-grid">
                <div className="node-card">
                  <div className="node-icon">📢</div>
                  <h4>顯示訊息</h4>
                  <p><strong>用途：</strong>顯示執行狀態</p>
                  <p><strong>設定：</strong>訊息內容</p>
                  <p><strong>說明：</strong>在執行過程中顯示提示訊息</p>
                </div>
                <div className="node-card">
                  <div className="node-icon">🔗</div>
                  <h4>現有流程</h4>
                  <p><strong>用途：</strong>呼叫其他流程</p>
                  <p><strong>設定：</strong>流程ID、參數映射</p>
                  <p><strong>說明：</strong>實現流程的模組化和重用</p>
                </div>
              </div>
              
              <h3>Token管理</h3>
              <div className="node-grid">
                <div className="node-card">
                  <div className="node-icon">🔑</div>
                  <h4>API Token</h4>
                  <p><strong>用途：</strong>安全儲存API金鑰</p>
                  <p><strong>設定：</strong>Token名稱、值</p>
                  <p><strong>說明：</strong>使用 {'{tokenName}'} 引用已儲存的Token</p>
                </div>
              </div>

              <h3>節點配置技巧</h3>
              <div className="tips-section">
                <div className="tip-item">
                  <h4>💡 資料引用</h4>
                  <p>使用 {'{變數名}'} 格式引用前面節點的輸出資料</p>
                </div>
                <div className="tip-item">
                  <h4>💡 條件設定</h4>
                  <p>條件節點會產生兩個輸出：true和false分支</p>
                </div>
                <div className="tip-item">
                  <h4>💡 錯誤處理</h4>
                  <p>HTTP請求節點會自動處理錯誤並提供錯誤資訊</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'workflow':
        return (
          <div className="manual-content">
            <h2>⚡ 流程操作</h2>
            <div className="content-section">
              <h3>建立流程</h3>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <h4>1. 規劃流程</h4>
                  <ul>
                    <li>明確流程目標和需求</li>
                    <li>識別所需的節點類型</li>
                    <li>設計資料流向</li>
                    <li>考慮錯誤處理機制</li>
                  </ul>
                </div>
                <div className="workflow-step">
                  <h4>2. 建立節點</h4>
                  <ul>
                    <li>從進入點開始建立</li>
                    <li>按邏輯順序添加節點</li>
                    <li>配置每個節點的參數</li>
                    <li>設定資料映射關係</li>
                  </ul>
                </div>
                <div className="workflow-step">
                  <h4>3. 連接節點</h4>
                  <ul>
                    <li>建立主要執行路徑</li>
                    <li>添加條件分支</li>
                    <li>設定錯誤處理路徑</li>
                    <li>確保流程完整性</li>
                  </ul>
                </div>
                <div className="workflow-step">
                  <h4>4. 測試驗證</h4>
                  <ul>
                    <li>單獨測試每個節點</li>
                    <li>執行完整流程測試</li>
                    <li>驗證各種情境</li>
                    <li>優化效能和邏輯</li>
                  </ul>
                </div>
              </div>

              <h3>流程管理</h3>
              <div className="management-grid">
                <div className="management-card">
                  <h4>💾 儲存流程</h4>
                  <p>點擊「儲存工作流程」按鈕保存當前設計</p>
                  <ul>
                    <li>自動生成唯一ID</li>
                    <li>保存所有節點和連線</li>
                    <li>記錄參數設定</li>
                  </ul>
                </div>
                <div className="management-card">
                  <h4>📂 載入流程</h4>
                  <p>從流程列表中選擇要編輯的流程</p>
                  <ul>
                    <li>顯示所有已儲存流程</li>
                    <li>支援搜尋和篩選</li>
                    <li>預覽流程資訊</li>
                  </ul>
                </div>
                <div className="management-card">
                  <h4>📋 複製流程</h4>
                  <p>基於現有流程建立新版本</p>
                  <ul>
                    <li>保留原始設計</li>
                    <li>允許修改和優化</li>
                    <li>獨立的流程ID</li>
                  </ul>
                </div>
                <div className="management-card">
                  <h4>🗑️ 刪除流程</h4>
                  <p>移除不需要的流程</p>
                  <ul>
                    <li>確認刪除對話框</li>
                    <li>無法復原操作</li>
                    <li>清理相關資料</li>
                  </ul>
                </div>
              </div>

              <h3>流程設定</h3>
              <div className="settings-section">
                <h4>基本設定</h4>
                <ul>
                  <li><strong>流程名稱：</strong>為流程設定有意義的名稱</li>
                  <li><strong>描述：</strong>記錄流程的用途和功能</li>
                  <li><strong>版本：</strong>管理流程的不同版本</li>
                </ul>
                
                <h4>參數設定</h4>
                <ul>
                  <li><strong>輸入參數：</strong>定義流程執行時需要的輸入</li>
                  <li><strong>輸出參數：</strong>指定流程完成後的輸出</li>
                  <li><strong>預設值：</strong>為參數設定預設值</li>
                </ul>
              </div>

              <h3>最佳實踐</h3>
              <div className="best-practices">
                <div className="practice-item">
                  <h4>🎯 清晰命名</h4>
                  <p>為節點和流程使用描述性的名稱，便於理解和維護</p>
                </div>
                <div className="practice-item">
                  <h4>🔄 模組化設計</h4>
                  <p>將複雜流程拆分為多個小流程，提高重用性</p>
                </div>
                <div className="practice-item">
                  <h4>🛡️ 錯誤處理</h4>
                  <p>為關鍵節點添加錯誤處理邏輯，提高流程穩定性</p>
                </div>
                <div className="practice-item">
                  <h4>📝 文件記錄</h4>
                  <p>在節點描述中記錄重要資訊和注意事項</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'execution':
        return (
          <div className="manual-content">
            <h2>▶️ 執行與測試</h2>
            <div className="content-section">
              <h3>執行流程</h3>
              <div className="execution-steps">
                <div className="exec-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>準備輸入資料</h4>
                    <p>在執行面板中輸入流程所需的初始資料</p>
                    <ul>
                      <li>JSON格式的資料</li>
                      <li>符合流程參數定義</li>
                      <li>包含所有必要欄位</li>
                    </ul>
                  </div>
                </div>
                <div className="exec-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>啟動執行</h4>
                    <p>點擊「執行工作流程」按鈕開始執行</p>
                    <ul>
                      <li>系統會驗證流程完整性</li>
                      <li>檢查所有節點配置</li>
                      <li>確認資料格式正確</li>
                    </ul>
                  </div>
                </div>
                <div className="exec-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>監控執行</h4>
                    <p>觀察執行進度和狀態變化</p>
                    <ul>
                      <li>節點執行狀態指示</li>
                      <li>即時執行日誌</li>
                      <li>錯誤訊息提示</li>
                    </ul>
                  </div>
                </div>
                <div className="exec-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>查看結果</h4>
                    <p>檢查執行結果和輸出資料</p>
                    <ul>
                      <li>最終輸出資料</li>
                      <li>執行統計資訊</li>
                      <li>效能分析報告</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>測試功能</h3>
              <div className="testing-grid">
                <div className="test-card">
                  <h4>🔍 單節點測試</h4>
                  <p>獨立測試單個節點的功能</p>
                  <ul>
                    <li>點擊節點開啟編輯器</li>
                    <li>使用「測試」功能</li>
                    <li>驗證節點邏輯正確性</li>
                    <li>檢查輸出格式</li>
                  </ul>
                </div>
                <div className="test-card">
                  <h4>🧪 部分流程測試</h4>
                  <p>測試流程的特定部分</p>
                  <ul>
                    <li>選擇起始節點</li>
                    <li>設定測試範圍</li>
                    <li>提供模擬資料</li>
                    <li>驗證執行路徑</li>
                  </ul>
                </div>
                <div className="test-card">
                  <h4>🎯 完整流程測試</h4>
                  <p>端到端的完整測試</p>
                  <ul>
                    <li>使用真實資料</li>
                    <li>測試所有分支</li>
                    <li>驗證錯誤處理</li>
                    <li>檢查效能表現</li>
                  </ul>
                </div>
                <div className="test-card">
                  <h4>🔄 回歸測試</h4>
                  <p>確保修改不影響現有功能</p>
                  <ul>
                    <li>重複執行測試案例</li>
                    <li>比較執行結果</li>
                    <li>識別潛在問題</li>
                    <li>確保品質穩定</li>
                  </ul>
                </div>
              </div>

              <h3>執行狀態</h3>
              <div className="status-indicators">
                <div className="status-item">
                  <span className="status-icon waiting">⏳</span>
                  <div>
                    <h4>等待中</h4>
                    <p>節點尚未開始執行</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon running">⚡</span>
                  <div>
                    <h4>執行中</h4>
                    <p>節點正在處理中</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon success">✅</span>
                  <div>
                    <h4>成功</h4>
                    <p>節點執行完成</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon error">❌</span>
                  <div>
                    <h4>錯誤</h4>
                    <p>節點執行失敗</p>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-icon skipped">⏭️</span>
                  <div>
                    <h4>跳過</h4>
                    <p>條件不符合，跳過執行</p>
                  </div>
                </div>
              </div>

              <h3>除錯技巧</h3>
              <div className="debug-tips">
                <div className="tip-card">
                  <h4>📊 查看執行日誌</h4>
                  <p>詳細的執行記錄幫助識別問題</p>
                </div>
                <div className="tip-card">
                  <h4>🔍 檢查資料流</h4>
                  <p>確認資料在節點間正確傳遞</p>
                </div>
                <div className="tip-card">
                  <h4>⚠️ 注意錯誤訊息</h4>
                  <p>錯誤訊息提供問題的具體資訊</p>
                </div>
                <div className="tip-card">
                  <h4>🎯 逐步測試</h4>
                  <p>從簡單到複雜，逐步驗證功能</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="manual-content">
            <h2>⚙️ 進階功能</h2>
            <div className="content-section">
              <h3>資料映射與轉換</h3>
              <div className="advanced-section">
                <h4>動態資料引用</h4>
                <div className="code-example">
                  <p>使用大括號語法引用前面節點的資料：</p>
                  <pre>{`{
  "message": "{http-request-1.response.data.message}",
  "userId": "{webhook-trigger.body.userId}",
  "timestamp": "{current_time}"
}`}</pre>
                </div>
                
                <h4>條件表達式</h4>
                <div className="expression-table">
                  <div className="expr-row">
                    <span className="operator">equals</span>
                    <span className="description">完全相等比較</span>
                    <span className="example">name equals "John"</span>
                  </div>
                  <div className="expr-row">
                    <span className="operator">contains</span>
                    <span className="description">包含子字串</span>
                    <span className="example">message contains "hello"</span>
                  </div>
                  <div className="expr-row">
                    <span className="operator">startsWith</span>
                    <span className="description">以...開始</span>
                    <span className="example">text startsWith "Hi"</span>
                  </div>
                  <div className="expr-row">
                    <span className="operator">endsWith</span>
                    <span className="description">以...結束</span>
                    <span className="example">filename endsWith ".pdf"</span>
                  </div>
                  <div className="expr-row">
                    <span className="operator">greaterThan</span>
                    <span className="description">大於比較</span>
                    <span className="example">age greaterThan 18</span>
                  </div>
                  <div className="expr-row">
                    <span className="operator">lessThan</span>
                    <span className="description">小於比較</span>
                    <span className="example">score lessThan 60</span>
                  </div>
                </div>
              </div>

              <h3>流程參數化</h3>
              <div className="advanced-section">
                <h4>輸入參數定義</h4>
                <p>在流程設定中定義可重用的輸入參數：</p>
                <div className="param-example">
                  <pre>{`{
  "name": "apiKey",
  "type": "string",
  "required": true,
  "description": "API金鑰",
  "defaultValue": ""
}`}</pre>
                </div>
                
                <h4>輸出參數定義</h4>
                <p>指定流程完成後的輸出格式：</p>
                <div className="param-example">
                  <pre>{`{
  "name": "result",
  "type": "object",
  "description": "處理結果",
  "schema": {
    "success": "boolean",
    "data": "object",
    "message": "string"
  }
}`}</pre>
                </div>
              </div>

              <h3>錯誤處理策略</h3>
              <div className="error-handling">
                <div className="strategy-card">
                  <h4>🔄 重試機制</h4>
                  <p>對於網路請求失敗，可設定自動重試</p>
                  <ul>
                    <li>設定重試次數</li>
                    <li>配置重試間隔</li>
                    <li>指定重試條件</li>
                  </ul>
                </div>
                <div className="strategy-card">
                  <h4>🛡️ 容錯處理</h4>
                  <p>當節點執行失敗時的處理方式</p>
                  <ul>
                    <li>跳過錯誤繼續執行</li>
                    <li>使用預設值</li>
                    <li>執行備用流程</li>
                  </ul>
                </div>
                <div className="strategy-card">
                  <h4>📝 錯誤記錄</h4>
                  <p>詳細記錄錯誤資訊用於除錯</p>
                  <ul>
                    <li>錯誤類型和訊息</li>
                    <li>發生時間和位置</li>
                    <li>相關的資料內容</li>
                  </ul>
                </div>
              </div>

              <h3>效能優化</h3>
              <div className="optimization-tips">
                <div className="opt-tip">
                  <h4>⚡ 並行執行</h4>
                  <p>獨立的節點可以並行執行，提高效率</p>
                </div>
                <div className="opt-tip">
                  <h4>💾 資料快取</h4>
                  <p>快取常用的API回應，減少重複請求</p>
                </div>
                <div className="opt-tip">
                  <h4>🎯 條件優化</h4>
                  <p>將最可能為真的條件放在前面</p>
                </div>
                <div className="opt-tip">
                  <h4>📊 監控效能</h4>
                  <p>定期檢查執行時間和資源使用</p>
                </div>
              </div>

              <h3>安全性考量</h3>
              <div className="security-section">
                <h4>🔐 敏感資料保護</h4>
                <ul>
                  <li>API金鑰和密碼使用環境變數</li>
                  <li>避免在流程中硬編碼敏感資訊</li>
                  <li>使用加密傳輸協定</li>
                </ul>
                
                <h4>🛡️ 輸入驗證</h4>
                <ul>
                  <li>驗證輸入資料格式和範圍</li>
                  <li>防止注入攻擊</li>
                  <li>限制資料大小和類型</li>
                </ul>
                
                <h4>📋 存取控制</h4>
                <ul>
                  <li>限制流程的執行權限</li>
                  <li>記錄操作日誌</li>
                  <li>定期審查安全設定</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="manual-content">
            <h2>❓ 常見問題</h2>
            <div className="content-section">
              <h3>連接問題</h3>
              <div className="faq-section">
                <div className="faq-item">
                  <h4>Q: 無法連接節點怎麼辦？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 請檢查以下項目：</p>
                    <ul>
                      <li>確認節點有正確的輸入/輸出點</li>
                      <li>檢查是否存在循環連接</li>
                      <li>確認連接方向正確（從輸出到輸入）</li>
                      <li>重新整理頁面後再試</li>
                    </ul>
                  </div>
                </div>
                
                <div className="faq-item">
                  <h4>Q: 連線顯示異常或消失？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 可能的解決方案：</p>
                    <ul>
                      <li>縮放畫布到適當大小</li>
                      <li>檢查瀏覽器相容性</li>
                      <li>清除瀏覽器快取</li>
                      <li>重新載入流程</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>執行問題</h3>
              <div className="faq-section">
                <div className="faq-item">
                  <h4>Q: 流程執行失敗或卡住？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 排查步驟：</p>
                    <ul>
                      <li>檢查所有節點的配置是否完整</li>
                      <li>確認API端點可以正常訪問</li>
                      <li>驗證輸入資料格式正確</li>
                      <li>查看執行日誌中的錯誤訊息</li>
                      <li>逐個測試節點功能</li>
                    </ul>
                  </div>
                </div>
                
                <div className="faq-item">
                  <h4>Q: HTTP請求節點回傳錯誤？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 常見原因和解決方法：</p>
                    <ul>
                      <li><strong>401錯誤：</strong>檢查API金鑰或認證資訊</li>
                      <li><strong>404錯誤：</strong>確認URL路徑正確</li>
                      <li><strong>500錯誤：</strong>檢查請求資料格式</li>
                      <li><strong>CORS錯誤：</strong>確認API支援跨域請求</li>
                      <li><strong>超時錯誤：</strong>增加請求超時時間</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>資料問題</h3>
              <div className="faq-section">
                <div className="faq-item">
                  <h4>Q: 資料映射不正確？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 檢查要點：</p>
                    <ul>
                      <li>確認資料路徑語法正確 {'{node.field}'}</li>
                      <li>檢查前置節點是否成功執行</li>
                      <li>驗證資料結構是否符合預期</li>
                      <li>使用瀏覽器開發者工具查看實際資料</li>
                    </ul>
                  </div>
                </div>
                
                <div className="faq-item">
                  <h4>Q: 條件判斷不生效？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 可能的問題：</p>
                    <ul>
                      <li>檢查比較值的資料類型</li>
                      <li>確認運算子選擇正確</li>
                      <li>注意大小寫敏感性</li>
                      <li>檢查空值或undefined情況</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>LINE Bot問題</h3>
              <div className="faq-section">
                <div className="faq-item">
                  <h4>Q: LINE訊息發送失敗？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 檢查清單：</p>
                    <ul>
                      <li>確認Channel Access Token正確</li>
                      <li>檢查用戶ID或Reply Token有效性</li>
                      <li>驗證訊息格式符合LINE API規範</li>
                      <li>確認Bot已加入聊天室或好友</li>
                    </ul>
                  </div>
                </div>
                
                <div className="faq-item">
                  <h4>Q: Webhook接收不到資料？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 排查方向：</p>
                    <ul>
                      <li>確認Webhook URL設定正確</li>
                      <li>檢查SSL憑證有效性</li>
                      <li>驗證LINE平台的Webhook設定</li>
                      <li>查看伺服器日誌</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>效能問題</h3>
              <div className="faq-section">
                <div className="faq-item">
                  <h4>Q: 流程執行速度很慢？</h4>
                  <div className="faq-answer">
                    <p><strong>A:</strong> 優化建議：</p>
                    <ul>
                      <li>減少不必要的API呼叫</li>
                      <li>優化資料處理邏輯</li>
                      <li>使用快取機制</li>
                      <li>並行處理獨立的節點</li>
                      <li>檢查網路連線品質</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>獲得幫助</h3>
              <div className="help-section">
                <div className="help-card">
                  <h4>📚 查看文件</h4>
                  <p>詳細閱讀本說明書的相關章節</p>
                </div>
                <div className="help-card">
                  <h4>🔍 檢查日誌</h4>
                  <p>查看瀏覽器控制台和執行日誌</p>
                </div>
                <div className="help-card">
                  <h4>🧪 簡化測試</h4>
                  <p>建立最小化的測試案例</p>
                </div>
                <div className="help-card">
                  <h4>💬 尋求支援</h4>
                  <p>聯繫技術支援團隊</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>選擇一個章節開始閱讀</div>;
    }
  };

  return (
    <div className="manual-overlay">
      <div className="manual-container">
        <div className="manual-header">
          <h1>📖 FlowBuilder - 使用說明書</h1>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="manual-body">
          <div className="manual-sidebar">
            <nav className="manual-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="nav-icon">{section.icon}</span>
                  <span className="nav-title">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="manual-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManual;