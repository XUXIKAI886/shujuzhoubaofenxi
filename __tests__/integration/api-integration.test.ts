/**
 * API集成测试套件
 * 测试完整的API调用流程和错误处理
 */

import { NextRequest } from 'next/server';
import { POST } from '../../app/api/generate-report/route';
import { APIClient } from '../../lib/api-client';

// 模拟APIClient
jest.mock('../../lib/api-client');
const MockedAPIClient = APIClient as jest.MockedClass<typeof APIClient>;

describe('API路由集成测试', () => {
  let mockAPIClient: jest.Mocked<APIClient>;

  beforeEach(() => {
    mockAPIClient = {
      generateReport: jest.fn()
    } as any;
    
    MockedAPIClient.mockImplementation(() => mockAPIClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('成功场景测试', () => {
    test('应该成功处理有效的报告生成请求', async () => {
      const reportData = {
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

      const apiKey = 'test-api-key';
      const expectedResponse = {
        success: true,
        data: '<html><body><h1>生成的报告</h1></body></html>'
      };

      mockAPIClient.generateReport.mockResolvedValue(expectedResponse);

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData, apiKey }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(expectedResponse);
      expect(mockAPIClient.generateReport).toHaveBeenCalledWith(reportData, apiKey);
    });

    test('应该处理包含推广数据的请求', async () => {
      const reportDataWithPromotion = {
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
        promotionData: {
          thisWeek: {
            cost: 500,
            exposureCount: 2000,
            visitCount: 100,
            visitRate: 5.0,
            costPerVisit: 5.0
          },
          lastWeek: {
            cost: 450,
            exposureCount: 1800,
            visitCount: 90,
            visitRate: 5.0,
            costPerVisit: 5.0
          }
        },
        generatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockAPIClient.generateReport.mockResolvedValue({
        success: true,
        data: '<html><body><h1>包含推广数据的报告</h1></body></html>'
      });

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ 
          reportData: reportDataWithPromotion, 
          apiKey: 'test-key' 
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(mockAPIClient.generateReport).toHaveBeenCalledWith(
        reportDataWithPromotion, 
        'test-key'
      );
    });
  });

  describe('错误处理测试', () => {
    test('应该拒绝缺少必要参数的请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({}), // 缺少参数
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('缺少必要参数');
      expect(mockAPIClient.generateReport).not.toHaveBeenCalled();
    });

    test('应该拒绝缺少reportData的请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'test-key' }), // 缺少reportData
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('缺少必要参数');
    });

    test('应该拒绝缺少apiKey的请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData: {} }), // 缺少apiKey
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('缺少必要参数');
    });

    test('应该处理APIClient错误', async () => {
      const reportData = {
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

      mockAPIClient.generateReport.mockResolvedValue({
        success: false,
        error: 'API密钥无效'
      });

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData, apiKey: 'invalid-key' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200); // APIClient错误通过返回值处理，不是HTTP错误
      expect(result.success).toBe(false);
      expect(result.error).toBe('API密钥无效');
    });

    test('应该处理APIClient抛出的异常', async () => {
      const reportData = {
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

      mockAPIClient.generateReport.mockRejectedValue(new Error('网络连接失败'));

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData, apiKey: 'test-key' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('网络连接失败');
    });

    test('应该处理JSON解析错误', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: 'invalid json', // 无效JSON
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain('服务器内部错误');
    });

    test('应该处理未知错误', async () => {
      const reportData = {
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

      // 模拟非Error类型的异常
      mockAPIClient.generateReport.mockRejectedValue('Unknown error type');

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData, apiKey: 'test-key' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('服务器内部错误');
    });
  });

  describe('数据验证测试', () => {
    test('应该接受最小化的有效数据', async () => {
      const minimalData = {
        shopInfo: {
          shopName: '餐厅',
          category: '餐饮',
          address: '地址',
          businessHours: '09:00-22:00'
        },
        operationData: {
          thisWeek: {
            exposureCount: 0,
            visitCount: 0,
            visitConversionRate: 0,
            orderConversionRate: 0,
            orderCount: 0,
            repurchaseRate: 0
          },
          lastWeek: {
            exposureCount: 0,
            visitCount: 0,
            visitConversionRate: 0,
            orderConversionRate: 0,
            orderCount: 0,
            repurchaseRate: 0
          }
        },
        generatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockAPIClient.generateReport.mockResolvedValue({
        success: true,
        data: '<html><body>最小化数据报告</body></html>'
      });

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData: minimalData, apiKey: 'test' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });

    test('应该处理包含特殊字符的数据', async () => {
      const specialCharData = {
        shopInfo: {
          shopName: '测试"餐厅\'<>&',
          category: '中式快餐 & 小吃',
          address: '北京市朝阳区 > 测试街道 < 123号',
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

      mockAPIClient.generateReport.mockResolvedValue({
        success: true,
        data: '<html><body>特殊字符处理报告</body></html>'
      });

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData: specialCharData, apiKey: 'test' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(mockAPIClient.generateReport).toHaveBeenCalledWith(
        specialCharData,
        'test'
      );
    });
  });

  describe('性能和边界测试', () => {
    test('应该处理大数值', async () => {
      const largeNumberData = {
        shopInfo: {
          shopName: '测试餐厅',
          category: '中式快餐',
          address: '北京市朝阳区测试街道123号',
          businessHours: '09:00-22:00'
        },
        operationData: {
          thisWeek: {
            exposureCount: Number.MAX_SAFE_INTEGER,
            visitCount: 999999999,
            visitConversionRate: 99.99,
            orderConversionRate: 99.99,
            orderCount: 999999999,
            repurchaseRate: 99.99
          },
          lastWeek: {
            exposureCount: Number.MAX_SAFE_INTEGER - 1,
            visitCount: 999999998,
            visitConversionRate: 99.98,
            orderConversionRate: 99.98,
            orderCount: 999999998,
            repurchaseRate: 99.98
          }
        },
        generatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockAPIClient.generateReport.mockResolvedValue({
        success: true,
        data: '<html><body>大数值报告</body></html>'
      });

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData: largeNumberData, apiKey: 'test' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });

    test('应该处理长字符串', async () => {
      const longStringData = {
        shopInfo: {
          shopName: 'A'.repeat(50), // 最大长度
          category: '超长的经营品类描述包含各种各样的食品和饮料选项',
          address: 'A'.repeat(200), // 最大长度
          businessHours: '00:00-23:59'
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

      mockAPIClient.generateReport.mockResolvedValue({
        success: true,
        data: '<html><body>长字符串报告</body></html>'
      });

      const request = new NextRequest('http://localhost:3000/api/generate-report', {
        method: 'POST',
        body: JSON.stringify({ reportData: longStringData, apiKey: 'test' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });
  });
});