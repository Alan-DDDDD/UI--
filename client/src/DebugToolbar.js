import React from 'react';
import './DebugToolbar.css';

function DebugToolbar({ 
  isDebugging, 
  debugStatus, 
  onStartDebug, 
  onStep, 
  onContinue, 
  onPause, 
  onStop,
  currentNode,
  callStackDepth = 0
}) {
  return (
    <div className="debug-toolbar">
      {!isDebugging ? (
        <button onClick={onStartDebug} className="debug-btn start">
          🐛 開始調試
        </button>
      ) : (
        <div className="debug-controls">
          <button onClick={onStep} disabled={debugStatus === 'running'}>
            ⏭️ 單步
          </button>
          <button onClick={onContinue} disabled={debugStatus === 'running'}>
            ▶️ 繼續
          </button>
          <button onClick={onPause} disabled={debugStatus !== 'running'}>
            ⏸️ 暫停
          </button>
          <button onClick={onStop}>
            ⏹️ 停止
          </button>
          <div className="debug-info">
            <span className="status">狀態: {debugStatus}</span>
            {currentNode && <span className="current-node">節點: {currentNode}</span>}
            {callStackDepth > 0 && <span className="depth">深度: {callStackDepth}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugToolbar;