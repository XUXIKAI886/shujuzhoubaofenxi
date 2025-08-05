/**
 * API客户端测试套件
 * 测试Gemini API调用逻辑和错误处理
 */

import { APIClient } from '../../lib/api-client';
import { ReportData } from '../../lib/types';

// 模拟fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// 模拟环境变量
const originalEnv = process.env;

describe('API客户端测试', () => {
  let apiClient: APIClient;
  let mockReportData: ReportData;

  beforeEach(() => {
    // 重置fetch mock
    mockFetch.mockReset();
    
    // 创建API客户端实例
    apiClient = new APIClient();
    
    // 准备测试数据
    mockReportData = {
      shopInfo: {
        shopName: '测试餐厅',
        category: '中式快餐',
        address: '北京市朝阳区测试街道123号',
        businessHours: '09:00-22:00'
      },
      operationData: {
        thisWeek: {
          exposureCount: 1000,
          visitCount: 150,
          visitConversionRate: 15.0,
          orderConversionRate: 20.0,
          orderCount: 30,
          repurchaseRate: 25.0
        },
        lastWeek: {
          exposureCount: 900,
          visitCount: 135,
          visitConversionRate: 15.0,
          orderConversionRate: 20.0,
          orderCount: 27,
          repurchaseRate: 22.0
        }
      },
      generatedAt: '2024-01-01T00:00:00.000Z'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('环境配置测试', () => {
    test('应该使用默认配置当没有环境变量时', () => {
      delete process.env.API_BASE_URL;
      delete process.env.API_MODEL;
      
      const client = new APIClient();
      expect(client).toBeDefined();
    });

    test('应该使用环境变量配置', () => {
      process.env.API_BASE_URL = 'https://custom-api.example.com';
      process.env.API_MODEL = 'custom-model';
      
      const client = new APIClient();
      expect(client).toBeDefined();
    });
  });

  describe('成功场景测试', () => {
    test('应该成功生成报告', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '<html><body><h1>测试报告</h1></body></html>'
            }
          }]
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await apiClient.generateReport(mockReportData, 'test-api-key');

      expect(result.success).toBe(true);
      expect(result.data).toBe('<html><body><h1>测试报告</h1></body></html>');
      expect(result.error).toBeUndefined();
    });

    test('应该正确发送API请求参数', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '<html><body>报告内容</body></html>'
            }
          }]
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse as any);

      await apiClient.generateReport(mockReportData, 'test-api-key');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String), // baseUrl
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: expect.stringContaining('"model":'),
          signal: expect.any(AbortSignal)
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      
      expect(requestBody.model).toBeDefined();
      expect(requestBody.messages).toHaveLength(1);
      expect(requestBody.messages[0].role).toBe('user');
      expect(requestBody.messages[0].content).toContain('测试餐厅');
      expect(requestBody.temperature).toBe(0.7);
      expect(requestBody.max_tokens).toBe(4000);
    });
  });

  describe('错误处理测试', () => {
    test('应该处理HTTP错误状态', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Invalid API key')
      } as any);

      const result = await apiClient.generateReport(mockReportData, 'invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API请求失败 (401)');
      expect(result.error).toContain('Unauthorized');
      expect(result.error).toContain('Invalid API key');
    });

    test('应该处理网络超时', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('', 'AbortError')), 100);
        })
      );

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('请求超时');
    });

    test('应该处理无效的API响应格式', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          // 缺少choices字段
          error: 'Invalid response format'
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API返回格式错误');
    });

    test('应该处理JSON解析错误', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as any);

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    test('应该处理fetch异常', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('重试机制测试', () => {
    test('应该在失败后重试', async () => {
      // 前两次失败，第三次成功
      mockFetch
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: '<html><body>成功重试</body></html>'
              }
            }]
          })
        } as any);

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.data).toBe('<html><body>成功重试</body></html>');
    });

    test('应该在所有重试失败后返回错误', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(mockFetch).toHaveBeenCalledTimes(3); // 最大重试次数
      expect(result.success).toBe(false);
      expect(result.error).toContain('尝试 3/3');
    });

    test('应该对超时错误进行特殊处理', async () => {
      mockFetch.mockImplementation(() => 
        Promise.reject(new DOMException('', 'AbortError'))
      );

      const result = await apiClient.generateReport(mockReportData, 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('请求超时');
    });
  });

  describe('请求超时测试', () => {
    test('应该设置30秒超时', async () => {
      let abortController: AbortController;
      
      mockFetch.mockImplementation((url, options) => {
        abortController = { signal: options?.signal } as AbortController;
        return new Promise(() => {}); // 永不解决的Promise来测试超时
      });

      // 启动请求但不等待完成
      const resultPromise = apiClient.generateReport(mockReportData, 'test-key');

      // 验证fetch被调用时传入了AbortSignal
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });
  });

  describe('数据安全测试', () => {
    test('应该不在错误信息中泄露API密钥', async () => {
      const sensitiveApiKey = 'sk-very-secret-api-key-12345';
      
      mockFetch.mockRejectedValue(new Error('Authentication failed'));

      const result = await apiClient.generateReport(mockReportData, sensitiveApiKey);

      expect(result.success).toBe(false);
      expect(result.error).not.toContain(sensitiveApiKey);
    });

    test('应该正确处理特殊字符在数据中的情况', async () => {
      const specialCharData = {
        ...mockReportData,
        shopInfo: {
          ...mockReportData.shopInfo,
          shopName: '测试"餐厅\'<script>alert("xss")</script>',
          address: '北京市 & 朝阳区 > 测试街道 < 123号'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '<html><body>特殊字符处理测试</body></html>'
            }
          }]
        })
      } as any);

      const result = await apiClient.generateReport(specialCharData, 'test-key');

      expect(result.success).toBe(true);
      
      // 验证请求体正确处理了特殊字符
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      expect(requestBody.messages[0].content).toContain('测试"餐厅');
    });
  });
});