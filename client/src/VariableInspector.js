import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VariableInspector.css';

function VariableInspector({ isOpen, onClose, variables = {}, context = {}, isDebugging = false, debugControls = {} }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(() => {
    const x = window.innerWidth - 370;
    const y = window.innerHeight - 400;
    return { x: Math.max(20, x), y: Math.max(80, y) };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);
  
  const handleMouseMove = useCallback((e) => {
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    const maxX = window.innerWidth - 350;
    const maxY = window.innerHeight - 100;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.header-controls')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={panelRef}
      className={`variable-inspector-floating ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        right: 'auto',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="inspector-header" onMouseDown={handleMouseDown}>
        <div className="header-left">
          <span className="inspector-icon">🔍</span>
          <h4>調試面板</h4>
          {isDebugging && <span className="debug-indicator">●</span>}
        </div>
        <div className="header-controls">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="minimize-btn"
            title={isMinimized ? '展開' : '最小化'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            onClick={onClose} 
            className="close-btn" 
            title="關閉"
            style={{ pointerEvents: 'auto' }}
          >
            ✕
          </button>
        </div>
      </div>
      
      {!isMinimized && isDebugging && (
        <div className="debug-controls">
          <button onClick={debugControls.onStep} className="debug-btn step-btn" title="單步執行">
            ⏭️
          </button>
          <button onClick={debugControls.onContinue} className="debug-btn continue-btn" title="繼續執行">
            ▶️
          </button>
          <button onClick={debugControls.onPause} className="debug-btn pause-btn" title="暫停執行">
            ⏸️
          </button>
          <button onClick={debugControls.onStop} className="debug-btn stop-btn" title="停止調試">
            ⏹️
          </button>
        </div>
      )}
      
      {!isMinimized && (
        <div className="variable-sections">
          <div className="section">
            <h5>流程變數 ({Object.keys(variables).length})</h5>
            <div className="variables-list">
              {Object.entries(variables).length > 0 ? (
                Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="variable-item">
                    <span className="var-name">{key}:</span>
                    <span className="var-value">
                      {typeof value === 'object' ? 
                        JSON.stringify(value, null, 2) : 
                        String(value)
                      }
                    </span>
                  </div>
                ))
              ) : (
                <div className="no-variables">
                  {isDebugging ? '暫無變數' : '點擊功能列的🐛按鈕開始調試'}
                </div>
              )}
            </div>
          </div>
          
          {Object.keys(context).length > 0 && (
            <div className="section">
              <h5>上下文資料</h5>
              <div className="context-preview">
                {Object.entries(context).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="context-item">
                    <span className="context-key">{key}:</span>
                    <span className="context-value">
                      {typeof value === 'object' ? 
                        `{${Object.keys(value).length} keys}` : 
                        String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '')
                      }
                    </span>
                  </div>
                ))}
                {Object.keys(context).length > 5 && (
                  <div className="context-more">...還有 {Object.keys(context).length - 5} 個</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VariableInspector;