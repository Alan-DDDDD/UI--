// 測試說明書組件的簡單腳本
import React from 'react';
import ReactDOM from 'react-dom';
import UserManual from './UserManual';

// 測試說明書組件是否能正常渲染
const testManual = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  try {
    ReactDOM.render(
      <UserManual isOpen={true} onClose={() => console.log('Manual closed')} />,
      container
    );
    console.log('✅ UserManual component rendered successfully');
    return true;
  } catch (error) {
    console.error('❌ Error rendering UserManual:', error);
    return false;
  } finally {
    document.body.removeChild(container);
  }
};

// 如果在瀏覽器環境中運行
if (typeof window !== 'undefined') {
  window.testManual = testManual;
}

export default testManual;