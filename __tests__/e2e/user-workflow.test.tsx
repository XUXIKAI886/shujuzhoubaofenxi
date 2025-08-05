/**
 * 端到端用户工作流测试套件
 * 测试完整的用户操作流程
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../../app/page';

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 模拟window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
});

// 模拟fetch API
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// 模拟DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html)
}));

// 模拟下载和打印功能
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
Object.defineProperty(window, 'open', {
  value: jest.fn(() => ({
    document: { write: jest.fn(), close: jest.fn() },
    focus: jest.fn(),
    print: jest.fn()
  }))
});

describe('端到端用户工作流测试', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    (window.confirm as jest.Mock).mockClear();
  });

  describe('完整的成功流程测试', () => {
    test('应该完成从数据输入到报告生成的完整流程', async () => {
      const user = userEvent.setup();

      // 模拟成功的API响应
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: '<html><body><h1>数据周报</h1><p>曝光人数：1000</p></body></html>'
        })
      } as Response);

      render(<HomePage />);

      // 第一步：填写店铺信息
      expect(screen.getByText('美团外卖数据统计周报系统')).toBeInTheDocument();
      expect(screen.getByText('店铺信息')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/店铺名称/), '测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '中式快餐');
      await user.type(screen.getByLabelText(/店铺地址/), '北京市朝阳区测试街道123号');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');

      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 第二步：填写数据
      await waitFor(() => {
        expect(screen.getByText('店铺运营数据')).toBeInTheDocument();
      });

      // 填写本周数据
      const exposureInputs = screen.getAllByLabelText(/曝光人数/);
      const visitInputs = screen.getAllByLabelText(/入店人数/);
      const conversionRateInputs = screen.getAllByLabelText(/入店转化率/);
      const orderConversionInputs = screen.getAllByLabelText(/下单转化率/);
      const orderCountInputs = screen.getAllByLabelText(/下单人数/);
      const repurchaseRateInputs = screen.getAllByLabelText(/复购率/);

      // 本周数据
      await user.type(exposureInputs[0], '1000');
      await user.type(visitInputs[0], '150');
      await user.type(conversionRateInputs[0], '15');
      await user.type(orderConversionInputs[0], '20');
      await user.type(orderCountInputs[0], '30');
      await user.type(repurchaseRateInputs[0], '25');

      // 上周数据
      await user.type(exposureInputs[1], '900');
      await user.type(visitInputs[1], '135');
      await user.type(conversionRateInputs[1], '15');
      await user.type(orderConversionInputs[1], '20');
      await user.type(orderCountInputs[1], '27');
      await user.type(repurchaseRateInputs[1], '22');

      const generateButton = screen.getByRole('button', { name: /生成周报/ });
      await user.click(generateButton);

      // 第三步：输入API密钥
      await waitFor(() => {
        expect(screen.getByText('API配置')).toBeInTheDocument();
      });

      const apiKeyInput = screen.getByLabelText(/API密钥/);
      await user.type(apiKeyInput, 'test-api-key-12345');

      const generateReportButton = screen.getByRole('button', { name: /生成报告/ });
      await user.click(generateReportButton);

      // 第四步：显示加载状态
      await waitFor(() => {
        expect(screen.getByText('正在生成报告，请稍候...')).toBeInTheDocument();
      });

      // 第五步：显示生成的报告
      await waitFor(() => {
        expect(screen.getByText('数据统计周报')).toBeInTheDocument();
        expect(screen.getByText('曝光人数：1000')).toBeInTheDocument();
      }, { timeout: 5000 });

      // 验证API调用
      expect(mockFetch).toHaveBeenCalledWith('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"shopName":"测试餐厅"')
      });

      // 验证报告操作按钮
      expect(screen.getByRole('button', { name: /重新生成/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /下载报告/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /打印报告/ })).toBeInTheDocument();
    });

    test('应该支持包含推广数据的完整流程', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: '<html><body><h1>包含推广数据的周报</h1><p>推广花费：500元</p></body></html>'
        })
      } as Response);

      render(<HomePage />);

      // 第一步：店铺信息
      await user.type(screen.getByLabelText(/店铺名称/), '推广测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '奶茶饮品');
      await user.type(screen.getByLabelText(/店铺地址/), '上海市浦东新区测试路456号');
      await user.type(screen.getByLabelText(/营业时间/), '10:00-23:00');

      await user.click(screen.getByRole('button', { name: /下一步/ }));

      // 第二步：填写运营数据和推广数据
      await waitFor(() => {
        expect(screen.getByText('店铺运营数据')).toBeInTheDocument();
      });

      // 填写运营数据
      const exposureInputs = screen.getAllByLabelText(/曝光人数/);
      await user.type(exposureInputs[0], '2000');
      await user.type(exposureInputs[1], '1800');

      const visitInputs = screen.getAllByLabelText(/入店人数/);
      await user.type(visitInputs[0], '300');
      await user.type(visitInputs[1], '270');

      // 启用推广数据
      const promotionCheckbox = screen.getByRole('checkbox');
      await user.click(promotionCheckbox);

      await waitFor(() => {
        expect(screen.getByText('本周推广数据')).toBeInTheDocument();
      });

      // 填写推广数据
      const promoCostInputs = screen.getAllByLabelText(/推广花费/);
      await user.type(promoCostInputs[0], '500');
      await user.type(promoCostInputs[1], '450');

      const promoExposureInputs = screen.getAllByLabelText(/推广曝光量/);
      await user.type(promoExposureInputs[0], '5000');
      await user.type(promoExposureInputs[1], '4500');

      await user.click(screen.getByRole('button', { name: /生成周报/ }));

      // 第三步：API配置
      await waitFor(() => {
        expect(screen.getByText('API配置')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/API密钥/), 'promo-test-key');
      await user.click(screen.getByRole('button', { name: /生成报告/ }));

      // 验证包含推广数据的报告
      await waitFor(() => {
        expect(screen.getByText('推广花费：500元')).toBeInTheDocument();
      });

      // 验证API调用包含推广数据
      expect(mockFetch).toHaveBeenCalledWith('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"promotionData"')
      });
    });
  });

  describe('错误处理流程测试', () => {
    test('应该处理API调用失败的情况', async () => {
      const user = userEvent.setup();

      // 模拟API失败
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<HomePage />);

      // 快速填写表单到API配置步骤
      await user.type(screen.getByLabelText(/店铺名称/), '错误测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '测试品类');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      await waitFor(() => {
        const exposureInputs = screen.getAllByLabelText(/曝光人数/);
        user.type(exposureInputs[0], '1000');
      });

      await user.click(screen.getByRole('button', { name: /生成周报/ }));

      await waitFor(() => {
        expect(screen.getByText('API配置')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/API密钥/), 'invalid-key');
      await user.click(screen.getByRole('button', { name: /生成报告/ }));

      // 应该显示错误信息
      await waitFor(() => {
        expect(screen.getByText('网络请求失败，请检查网络连接')).toBeInTheDocument();
      });

      // 应该返回到API配置步骤
      expect(screen.getByText('API配置')).toBeInTheDocument();
    });

    test('应该处理API返回错误的情况', async () => {
      const user = userEvent.setup();

      // 模拟API返回错误
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'API密钥无效或已过期'
        })
      } as Response);

      render(<HomePage />);

      // 填写完整表单
      await user.type(screen.getByLabelText(/店铺名称/), '测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '快餐');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      await waitFor(() => {
        const exposureInputs = screen.getAllByLabelText(/曝光人数/);
        user.type(exposureInputs[0], '1000');
      });

      await user.click(screen.getByRole('button', { name: /生成周报/ }));

      await waitFor(() => {
        expect(screen.getByText('API配置')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/API密钥/), 'expired-key');
      await user.click(screen.getByRole('button', { name: /生成报告/ }));

      // 应该显示具体的API错误信息
      await waitFor(() => {
        expect(screen.getByText('API密钥无效或已过期')).toBeInTheDocument();
      });
    });

    test('应该处理表单验证错误', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // 尝试不填写表单直接提交
      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 应该显示验证错误
      await waitFor(() => {
        expect(screen.getByText('店铺名称不能为空')).toBeInTheDocument();
        expect(screen.getByText('经营品类不能为空')).toBeInTheDocument();
      });

      // 应该仍然在第一步
      expect(screen.getByText('店铺信息')).toBeInTheDocument();
    });

    test('应该处理业务逻辑验证警告', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // 填写店铺信息
      await user.type(screen.getByLabelText(/店铺名称/), '逻辑测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '测试');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      // 填写有逻辑错误的数据（入店人数大于曝光人数）
      await waitFor(() => {
        const exposureInputs = screen.getAllByLabelText(/曝光人数/);
        const visitInputs = screen.getAllByLabelText(/入店人数/);
        
        user.type(exposureInputs[0], '100');
        user.type(visitInputs[0], '150'); // 错误：入店人数大于曝光人数
      });

      await user.click(screen.getByRole('button', { name: /生成周报/ }));

      // 应该显示确认对话框
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          expect.stringContaining('入店人数不应超过曝光人数')
        );
      });
    });
  });

  describe('数据持久化测试', () => {
    test('应该保存表单数据到localStorage', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // 进入数据输入步骤
      await user.type(screen.getByLabelText(/店铺名称/), '持久化测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '测试');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      // 填写运营数据
      await waitFor(() => {
        const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
        user.type(exposureInput, '2000');
      });

      // 验证localStorage被调用
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reportForm_operationData',
        expect.stringContaining('"exposureCount":2000')
      );
    });

    test('应该从localStorage恢复数据', () => {
      const savedOperationData = {
        thisWeek: {
          exposureCount: 1500,
          visitCount: 225,
          visitConversionRate: 15.0,
          orderConversionRate: 20.0,
          orderCount: 45,
          repurchaseRate: 30.0
        },
        lastWeek: {
          exposureCount: 1350,
          visitCount: 203,
          visitConversionRate: 15.0,
          orderConversionRate: 20.0,
          orderCount: 41,
          repurchaseRate: 28.0
        }
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'reportForm_operationData') {
          return JSON.stringify(savedOperationData);
        }
        return null;
      });

      render(<HomePage />);

      // 跳到数据输入步骤
      const user = userEvent.setup();
      user.type(screen.getByLabelText(/店铺名称/), '恢复测试餐厅');
      user.type(screen.getByLabelText(/经营品类/), '测试');
      user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      user.click(screen.getByRole('button', { name: /下一步/ }));

      // 验证数据已被恢复
      waitFor(() => {
        const exposureInputs = screen.getAllByLabelText(/曝光人数/);
        expect(exposureInputs[0]).toHaveValue(1500);
        expect(exposureInputs[1]).toHaveValue(1350);
      });
    });
  });

  describe('用户体验测试', () => {
    test('应该显示进度指示器', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // 初始状态
      expect(screen.getByText('店铺信息')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 当前步骤标记

      // 进入下一步
      await user.type(screen.getByLabelText(/店铺名称/), '进度测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '测试');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      // 验证进度更新
      await waitFor(() => {
        expect(screen.getByText('数据录入')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // 当前步骤
      });
    });

    test('应该支持回退到上一步', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      // 完成第一步
      await user.type(screen.getByLabelText(/店铺名称/), '回退测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '测试');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      // 进入第二步
      await waitFor(() => {
        expect(screen.getByText('店铺运营数据')).toBeInTheDocument();
      });

      // 填写一些数据并进入第三步
      const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
      await user.type(exposureInput, '1000');
      await user.click(screen.getByRole('button', { name: /生成周报/ }));

      // 进入API配置步骤
      await waitFor(() => {
        expect(screen.getByText('API配置')).toBeInTheDocument();
      });

      // 点击上一步按钮
      const backButton = screen.getByRole('button', { name: /上一步/ });
      await user.click(backButton);

      // 应该回到数据输入步骤
      await waitFor(() => {
        expect(screen.getByText('店铺运营数据')).toBeInTheDocument();
      });

      // 验证数据仍然存在
      expect(screen.getAllByLabelText(/曝光人数/)[0]).toHaveValue(1000);
    });

    test('应该支持重新生成报告', async () => {
      const user = userEvent.setup();

      // 模拟成功的API响应
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: '<html><body><h1>测试报告</h1></body></html>'
        })
      } as Response);

      render(<HomePage />);

      // 快速完成整个流程到报告显示
      await user.type(screen.getByLabelText(/店铺名称/), '重新生成测试餐厅');
      await user.type(screen.getByLabelText(/经营品类/), '测试');
      await user.type(screen.getByLabelText(/店铺地址/), '测试地址');
      await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');
      await user.click(screen.getByRole('button', { name: /下一步/ }));

      await waitFor(() => {
        const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
        user.type(exposureInput, '1000');
      });

      await user.click(screen.getByRole('button', { name: /生成周报/ }));

      await waitFor(() => {
        const apiKeyInput = screen.getByLabelText(/API密钥/);
        user.type(apiKeyInput, 'test-key');
      });

      await user.click(screen.getByRole('button', { name: /生成报告/ }));

      // 等待报告显示
      await waitFor(() => {
        expect(screen.getByText('测试报告')).toBeInTheDocument();
      });

      // 点击重新生成
      const regenerateButton = screen.getByRole('button', { name: /重新生成/ });
      await user.click(regenerateButton);

      // 应该回到第一步
      await waitFor(() => {
        expect(screen.getByText('店铺信息')).toBeInTheDocument();
      });
    });
  });
});