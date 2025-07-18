import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NodeEditor from './NodeEditor';

// Mock fetch
global.fetch = jest.fn();

describe('NodeEditor Component', () => {
  const mockNode = {
    id: 'test-node-1',
    data: {
      type: 'http-request',
      label: 'API呼叫',
      url: 'https://api.example.com',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
  };

  const mockProps = {
    selectedNode: mockNode,
    onUpdateNode: jest.fn(),
    onDeleteNode: jest.fn(),
    onClose: jest.fn(),
    showNotification: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('renders when node is selected', () => {
    render(<NodeEditor {...mockProps} />);
    
    expect(screen.getByText('節點設定')).toBeInTheDocument();
    expect(screen.getByDisplayValue('API呼叫')).toBeInTheDocument();
  });

  test('does not render when no node selected', () => {
    render(<NodeEditor {...mockProps} selectedNode={null} />);
    
    expect(screen.queryByText('節點設定')).not.toBeInTheDocument();
  });

  test('updates node data when form fields change', () => {
    render(<NodeEditor {...mockProps} />);
    
    const urlInput = screen.getByDisplayValue('https://api.example.com');
    fireEvent.change(urlInput, { target: { value: 'https://new-api.example.com' } });
    
    expect(mockProps.onUpdateNode).toHaveBeenCalledWith(
      'test-node-1',
      expect.objectContaining({
        url: 'https://new-api.example.com'
      })
    );
  });

  test('handles HTTP request node configuration', () => {
    render(<NodeEditor {...mockProps} />);
    
    expect(screen.getByText('HTTP請求設定')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GET')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://api.example.com')).toBeInTheDocument();
  });

  test('handles condition node configuration', () => {
    const conditionNode = {
      id: 'condition-1',
      data: {
        type: 'condition',
        label: '條件判斷',
        field: '{message}',
        operator: 'contains',
        value: '你好'
      }
    };

    render(<NodeEditor {...mockProps} selectedNode={conditionNode} />);
    
    expect(screen.getByText('條件判斷設定')).toBeInTheDocument();
    expect(screen.getByDisplayValue('{message}')).toBeInTheDocument();
    expect(screen.getByDisplayValue('你好')).toBeInTheDocument();
  });

  test('deletes node when delete button clicked', () => {
    render(<NodeEditor {...mockProps} />);
    
    const deleteButton = screen.getByText('🗑️ 刪除節點');
    fireEvent.click(deleteButton);
    
    expect(mockProps.onDeleteNode).toHaveBeenCalledWith('test-node-1');
  });

  test('closes editor when close button clicked', () => {
    render(<NodeEditor {...mockProps} />);
    
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});