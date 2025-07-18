import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NodePanel from './NodePanel';

describe('NodePanel Component', () => {
  const mockProps = {
    onAddNode: jest.fn(),
    compact: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all node types in full mode', () => {
    render(<NodePanel {...mockProps} />);
    
    expect(screen.getByText('節點面板')).toBeInTheDocument();
    expect(screen.getByText('🌐 HTTP請求')).toBeInTheDocument();
    expect(screen.getByText('🔀 條件判斷')).toBeInTheDocument();
    expect(screen.getByText('📱 LINE回覆')).toBeInTheDocument();
    expect(screen.getByText('📤 LINE推送')).toBeInTheDocument();
    expect(screen.getByText('🎠 LINE多頁')).toBeInTheDocument();
    expect(screen.getByText('🔗 Webhook觸發')).toBeInTheDocument();
    expect(screen.getByText('💬 顯示訊息')).toBeInTheDocument();
    expect(screen.getByText('🔄 資料映射')).toBeInTheDocument();
    expect(screen.getByText('📋 現有流程')).toBeInTheDocument();
  });

  test('renders compact mode', () => {
    render(<NodePanel {...mockProps} compact={true} />);
    
    // 在精簡模式下，應該只顯示圖標
    expect(screen.queryByText('節點面板')).not.toBeInTheDocument();
  });

  test('handles drag start for HTTP request node', () => {
    render(<NodePanel {...mockProps} />);
    
    const httpNode = screen.getByText('🌐 HTTP請求');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    // Mock dataTransfer
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(httpNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'http-request'
    );
  });

  test('handles drag start for condition node', () => {
    render(<NodePanel {...mockProps} />);
    
    const conditionNode = screen.getByText('🔀 條件判斷');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(conditionNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'condition'
    );
  });

  test('handles drag start for LINE reply node', () => {
    render(<NodePanel {...mockProps} />);
    
    const lineReplyNode = screen.getByText('📱 LINE回覆');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(lineReplyNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'line-reply'
    );
  });

  test('handles drag start for LINE push node', () => {
    render(<NodePanel {...mockProps} />);
    
    const linePushNode = screen.getByText('📤 LINE推送');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(linePushNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'line-push'
    );
  });

  test('handles drag start for LINE carousel node', () => {
    render(<NodePanel {...mockProps} />);
    
    const carouselNode = screen.getByText('🎠 LINE多頁');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(carouselNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'line-carousel'
    );
  });

  test('handles drag start for webhook trigger node', () => {
    render(<NodePanel {...mockProps} />);
    
    const webhookNode = screen.getByText('🔗 Webhook觸發');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(webhookNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'webhook-trigger'
    );
  });

  test('handles drag start for notification node', () => {
    render(<NodePanel {...mockProps} />);
    
    const notificationNode = screen.getByText('💬 顯示訊息');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(notificationNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'notification'
    );
  });

  test('handles drag start for data mapping node', () => {
    render(<NodePanel {...mockProps} />);
    
    const dataMappingNode = screen.getByText('🔄 資料映射');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(dataMappingNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'data-map'
    );
  });

  test('handles drag start for existing workflow node', () => {
    render(<NodePanel {...mockProps} />);
    
    const existingWorkflowNode = screen.getByText('📋 現有流程');
    const dragEvent = new Event('dragstart', { bubbles: true });
    
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: ''
      }
    });

    fireEvent(existingWorkflowNode, dragEvent);
    
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'application/reactflow',
      'existing-workflow'
    );
  });

  test('shows node descriptions on hover', () => {
    render(<NodePanel {...mockProps} />);
    
    const httpNode = screen.getByText('🌐 HTTP請求');
    
    fireEvent.mouseEnter(httpNode);
    
    // 檢查是否顯示描述文字
    expect(screen.getByText('發送HTTP請求到指定URL')).toBeInTheDocument();
  });

  test('node items are draggable', () => {
    render(<NodePanel {...mockProps} />);
    
    const httpNode = screen.getByText('🌐 HTTP請求');
    
    expect(httpNode.closest('.node-item')).toHaveAttribute('draggable', 'true');
  });
});