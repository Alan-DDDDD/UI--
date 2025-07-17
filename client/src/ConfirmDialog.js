import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <h4>{title}</h4>
        </div>
        <div className="confirm-dialog-content">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button onClick={onConfirm} className="confirm-btn">
            確定
          </button>
          <button onClick={onCancel} className="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;