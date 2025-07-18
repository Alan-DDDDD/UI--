import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock ReactFlow
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  ReactFlowProvider: ({ children }) => <div data-testid="reactflow-provider">{children}</div>,
  useReactFlow: () => ({
    project: jest.fn((pos) => pos),
    getNodes: jest.fn(() => []),
    getEdges: jest.fn(() => [])
  }),
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  Controls: () => <div data-testid="controls" />,
  Background: () => <div data-testid="background" />
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders main app components', () => {
    render(<App />);
    
    expect(screen.getByTestId('reactflow-provider')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  test('sidebar toggle functionality', () => {
    render(<App />);
    
    const toggleButton = screen.getByRole('button', { name: /◀|▶|✕/ });
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    // 測試側邊欄狀態變化
  });

  test('shows unsaved changes warning', () => {
    render(<App />);
    
    // 模擬有未儲存的變更
    // 這需要觸發某些操作來設置hasUnsavedChanges狀態
  });

  test('notification system works', async () => {
    render(<App />);
    
    // 測試通知系統 - 這需要觸發一個會顯示通知的操作
  });
});

describe('Workflow Operations', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('save workflow', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ workflowId: 'test-id', success: true })
    });

    render(<App />);
    
    // 模擬儲存操作
    // 需要找到儲存按鈕並點擊
  });

  test('load workflow', async () => {
    const mockWorkflow = {
      nodes: [
        {
          id: 'test-node',
          type: 'default',
          position: { x: 100, y: 100 },
          data: { type: 'http-request', label: 'Test Node' }
        }
      ],
      edges: [],
      inputParams: [],
      outputParams: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWorkflow
    });

    render(<App />);
    
    // 測試載入流程功能
  });

  test('execute workflow', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        results: [
          {
            nodeId: 'test-node',
            result: { success: true, data: { message: 'Test successful' } }
          }
        ]
      })
    });

    render(<App />);
    
    // 測試執行流程功能
  });
});

describe('Node Operations', () => {
  test('add node via drag and drop', () => {
    render(<App />);
    
    // 模擬拖放操作添加節點
    const dropArea = screen.getByTestId('reactflow-provider');
    
    const dragEvent = new Event('dragover', { bubbles: true });
    const dropEvent = new Event('drop', { bubbles: true });
    
    // 設置拖放數據
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn(() => 'http-request')
      }
    });
    
    fireEvent(dropArea, dragEvent);
    fireEvent(dropArea, dropEvent);
  });

  test('select and edit node', () => {
    render(<App />);
    
    // 測試節點選擇和編輯功能
  });

  test('delete node', () => {
    render(<App />);
    
    // 測試節點刪除功能
  });
});

describe('Debug Features', () => {
  test('start debug session', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sessionId: 'debug-session-1',
        status: 'ready'
      })
    });

    render(<App />);
    
    // 測試開始調試會話
  });

  test('set breakpoint', () => {
    render(<App />);
    
    // 測試設置斷點功能
  });

  test('step execution', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'paused',
        currentNode: 'test-node',
        variables: { testVar: 'testValue' }
      })
    });

    render(<App />);
    
    // 測試單步執行功能
  });
});

describe('Error Handling', () => {
  test('handles API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<App />);
    
    // 測試API錯誤處理
  });

  test('shows error notifications', () => {
    render(<App />);
    
    // 測試錯誤通知顯示
  });

  test('validates workflow before execution', () => {
    render(<App />);
    
    // 測試流程驗證功能
  });
});