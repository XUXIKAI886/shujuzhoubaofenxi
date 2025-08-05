/**
 * 安全性测试套件
 * 测试XSS防护、HTML净化和安全头部设置
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DOMPurify from 'dompurify';
import { ReportDisplay } from '../../components/ReportDisplay';

// 模拟DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn()
}));

const mockDOMPurify = DOMPurify as jest.Mocked<typeof DOMPurify>;

// 模拟URL和Blob for download functionality
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// 模拟window.open for print functionality
Object.defineProperty(window, 'open', {
  value: jest.fn(() => ({
    document: {
      write: jest.fn(),
      close: jest.fn()
    },
    focus: jest.fn(),
    print: jest.fn()
  }))
});

describe('安全性测试', () => {
  const mockOnBackToForm = jest.fn();

  beforeEach(() => {
    mockDOMPurify.sanitize.mockClear();
    mockOnBackToForm.mockClear();
    (global.URL.createObjectURL as jest.Mock).mockClear();
    (global.URL.revokeObjectURL as jest.Mock).mockClear();
    (window.open as jest.Mock).mockClear();
  });

  describe('HTML净化测试', () => {
    test('应该净化包含脚本的HTML内容', () => {
      const maliciousHtml = `
        <h1>报告标题</h1>
        <script>alert('XSS攻击')</script>
        <p>正常内容</p>
        <img src="x" onerror="alert('XSS')" />
      `;

      const sanitizedHtml = '<h1>报告标题</h1><p>正常内容</p>';
      mockDOMPurify.sanitize.mockReturnValue(sanitizedHtml);

      render(<ReportDisplay htmlContent={maliciousHtml} onBackToForm={mockOnBackToForm} />);

      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(maliciousHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'div', 'span',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'ul', 'ol', 'li',
          'strong', 'b', 'em', 'i', 'u',
          'style'
        ],
        ALLOWED_ATTR: ['class', 'style', 'id'],
        ALLOW_DATA_ATTR: false,
        KEEP_CONTENT: true
      });
    });

    test('应该允许安全的HTML标签和属性', () => {
      const safeHtml = `
        <h1 class="title">报告标题</h1>
        <table class="data-table">
          <thead>
            <tr>
              <th>指标</th>
              <th>数值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>曝光人数</strong></td>
              <td><em>1000</em></td>
            </tr>
          </tbody>
        </table>
        <div style="margin: 10px;">
          <p>分析内容</p>
          <ul>
            <li>要点1</li>
            <li>要点2</li>
          </ul>
        </div>
      `;

      mockDOMPurify.sanitize.mockReturnValue(safeHtml);

      render(<ReportDisplay htmlContent={safeHtml} onBackToForm={mockOnBackToForm} />);

      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(
        safeHtml,
        expect.objectContaining({
          ALLOWED_TAGS: expect.arrayContaining(['h1', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'div', 'p', 'ul', 'li']),
          ALLOWED_ATTR: ['class', 'style', 'id'],
          ALLOW_DATA_ATTR: false
        })
      );
    });

    test('应该阻止危险的事件处理器', () => {
      const maliciousHtml = `
        <div onclick="maliciousFunction()">点击我</div>
        <a href="javascript:alert('XSS')">链接</a>
        <form onsubmit="steal_data()">表单</form>
        <input onchange="malicious_code()" />
      `;

      const sanitizedHtml = '<div>点击我</div>链接表单';
      mockDOMPurify.sanitize.mockReturnValue(sanitizedHtml);

      render(<ReportDisplay htmlContent={maliciousHtml} onBackToForm={mockOnBackToForm} />);

      expect(mockDOMPurify.sanitize).toHaveBeenCalled();
      
      // 验证净化后的内容不包含事件处理器
      const displayedContent = screen.getByText('点击我');
      expect(displayedContent).toBeInTheDocument();
      expect(displayedContent).not.toHaveAttribute('onclick');
    });

    test('应该处理data属性安全', () => {
      const htmlWithDataAttrs = `
        <div data-user-id="123" data-api-key="secret">内容</div>
        <span data-track="analytics">跟踪元素</span>
      `;

      const sanitizedHtml = '<div>内容</div><span>跟踪元素</span>';
      mockDOMPurify.sanitize.mockReturnValue(sanitizedHtml);

      render(<ReportDisplay htmlContent={htmlWithDataAttrs} onBackToForm={mockOnBackToForm} />);

      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(
        htmlWithDataAttrs,
        expect.objectContaining({
          ALLOW_DATA_ATTR: false
        })
      );
    });

    test('应该保持内容完整性', () => {
      const contentHtml = `
        <h1>数据周报</h1>
        <p>这是报告的主要内容，包含重要的业务数据分析。</p>
        <strong>重要提示：</strong>请仔细核查数据准确性。
      `;

      mockDOMPurify.sanitize.mockReturnValue(contentHtml);

      render(<ReportDisplay htmlContent={contentHtml} onBackToForm={mockOnBackToForm} />);

      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(
        contentHtml,
        expect.objectContaining({
          KEEP_CONTENT: true
        })
      );
    });
  });

  describe('下载安全测试', () => {
    test('应该使用净化后的HTML进行下载', () => {
      const originalHtml = '<h1>报告</h1><script>alert("xss")</script>';
      const sanitizedHtml = '<h1>报告</h1>';
      
      mockDOMPurify.sanitize.mockReturnValue(sanitizedHtml);

      render(<ReportDisplay htmlContent={originalHtml} onBackToForm={mockOnBackToForm} />);

      const downloadButton = screen.getByRole('button', { name: /下载报告/ });
      fireEvent.click(downloadButton);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/html;charset=utf-8'
        })
      );

      // 验证Blob内容是净化后的HTML
      const createObjectURLCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0];
      const blob = createObjectURLCall[0];
      expect(blob.constructor.name).toBe('Blob');
    });

    test('应该设置安全的文件名', () => {
      const html = '<h1>测试报告</h1>';
      mockDOMPurify.sanitize.mockReturnValue(html);

      // 模拟DOM元素创建和点击
      const mockAElement = {
        href: '',
        download: '',
        click: jest.fn(),
        remove: jest.fn()
      };

      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') {
          return mockAElement as any;
        }
        return originalCreateElement.call(document, tagName);
      });

      const originalAppendChild = document.body.appendChild;
      document.body.appendChild = jest.fn();

      const originalRemoveChild = document.body.removeChild;
      document.body.removeChild = jest.fn();

      render(<ReportDisplay htmlContent={html} onBackToForm={mockOnBackToForm} />);

      const downloadButton = screen.getByRole('button', { name: /下载报告/ });
      fireEvent.click(downloadButton);

      // 验证文件名格式
      expect(mockAElement.download).toMatch(/^数据周报_\d{8}\.html$/);

      // 恢复原始方法
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    });
  });

  describe('打印安全测试', () => {
    test('应该使用净化后的HTML进行打印', () => {
      const originalHtml = '<h1>报告</h1><script>alert("xss")</script>';
      const sanitizedHtml = '<h1>报告</h1>';
      
      mockDOMPurify.sanitize.mockReturnValue(sanitizedHtml);

      const mockPrintWindow = {
        document: {
          write: jest.fn(),
          close: jest.fn()
        },
        focus: jest.fn(),
        print: jest.fn()
      };

      (window.open as jest.Mock).mockReturnValue(mockPrintWindow);

      render(<ReportDisplay htmlContent={originalHtml} onBackToForm={mockOnBackToForm} />);

      const printButton = screen.getByRole('button', { name: /打印报告/ });
      fireEvent.click(printButton);

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockPrintWindow.document.write).toHaveBeenCalledWith(sanitizedHtml);
      expect(mockPrintWindow.document.close).toHaveBeenCalled();
      expect(mockPrintWindow.focus).toHaveBeenCalled();
      expect(mockPrintWindow.print).toHaveBeenCalled();
    });

    test('应该处理打印窗口打开失败的情况', () => {
      (window.open as jest.Mock).mockReturnValue(null);

      const html = '<h1>测试报告</h1>';
      mockDOMPurify.sanitize.mockReturnValue(html);

      render(<ReportDisplay htmlContent={html} onBackToForm={mockOnBackToForm} />);

      const printButton = screen.getByRole('button', { name: /打印报告/ });
      
      // 应该不会抛出错误
      expect(() => fireEvent.click(printButton)).not.toThrow();
    });
  });

  describe('代码查看安全测试', () => {
    test('应该安全显示原始HTML代码', () => {
      const htmlWithScripts = `
        <h1>报告标题</h1>
        <script>alert('这是原始代码中的脚本')</script>
        <p>正常内容</p>
      `;

      mockDOMPurify.sanitize.mockReturnValue('<h1>报告标题</h1><p>正常内容</p>');

      render(<ReportDisplay htmlContent={htmlWithScripts} onBackToForm={mockOnBackToForm} />);

      const viewCodeButton = screen.getByRole('button', { name: /查看代码/ });
      fireEvent.click(viewCodeButton);

      // 原始代码应该在<pre>标签中安全显示，不会被执行
      const preElement = screen.getByText(htmlWithScripts, { selector: 'pre' });
      expect(preElement).toBeInTheDocument();
      expect(preElement.tagName).toBe('PRE');
    });

    test('应该在预览和代码视图之间切换', () => {
      const html = '<h1>测试内容</h1>';
      mockDOMPurify.sanitize.mockReturnValue(html);

      render(<ReportDisplay htmlContent={html} onBackToForm={mockOnBackToForm} />);

      const toggleButton = screen.getByRole('button', { name: /查看代码/ });
      
      // 初始状态应该显示预览
      expect(screen.getByText('测试内容')).toBeInTheDocument();
      
      // 切换到代码视图
      fireEvent.click(toggleButton);
      expect(screen.getByRole('button', { name: /查看预览/ })).toBeInTheDocument();
      
      // 切换回预览
      fireEvent.click(screen.getByRole('button', { name: /查看预览/ }));
      expect(screen.getByRole('button', { name: /查看代码/ })).toBeInTheDocument();
    });
  });

  describe('安全提示显示测试', () => {
    test('应该显示安全提示信息', () => {
      const html = '<h1>测试报告</h1>';
      mockDOMPurify.sanitize.mockReturnValue(html);

      render(<ReportDisplay htmlContent={html} onBackToForm={mockOnBackToForm} />);

      expect(screen.getByText('安全提示：')).toBeInTheDocument();
      expect(screen.getByText(/此报告内容由AI生成，已通过安全净化处理/)).toBeInTheDocument();
      expect(screen.getByText(/请仔细核查数据准确性/)).toBeInTheDocument();
    });
  });

  describe('内容安全策略测试', () => {
    test('应该验证净化配置的严格性', () => {
      const testHtml = '<div>测试</div>';
      mockDOMPurify.sanitize.mockReturnValue(testHtml);

      render(<ReportDisplay htmlContent={testHtml} onBackToForm={mockOnBackToForm} />);

      const sanitizeCall = mockDOMPurify.sanitize.mock.calls[0];
      const config = sanitizeCall[1];

      // 验证配置的严格性
      expect(config.ALLOW_DATA_ATTR).toBe(false);
      expect(config.KEEP_CONTENT).toBe(true);
      
      // 验证允许的标签是安全的
      const allowedTags = config.ALLOWED_TAGS;
      expect(allowedTags).not.toContain('script');
      expect(allowedTags).not.toContain('iframe');
      expect(allowedTags).not.toContain('object');
      expect(allowedTags).not.toContain('embed');
      expect(allowedTags).not.toContain('applet');
      
      // 验证允许的属性是安全的
      const allowedAttrs = config.ALLOWED_ATTR;
      expect(allowedAttrs).not.toContain('onclick');
      expect(allowedAttrs).not.toContain('onload');
      expect(allowedAttrs).not.toContain('onerror');
      expect(allowedAttrs).not.toContain('href');
      expect(allowedAttrs).not.toContain('src');
    });
  });
});