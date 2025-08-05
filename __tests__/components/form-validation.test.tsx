/**
 * 表单组件验证测试套件
 * 测试表单验证、用户交互和数据持久化
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopInfoForm } from '../../components/ShopInfoForm';
import { DataInputForm } from '../../components/DataInputForm';

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

describe('店铺信息表单测试', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('应该渲染所有必填字段', () => {
    render(<ShopInfoForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/店铺名称/)).toBeInTheDocument();
    expect(screen.getByLabelText(/经营品类/)).toBeInTheDocument();
    expect(screen.getByLabelText(/店铺地址/)).toBeInTheDocument();
    expect(screen.getByLabelText(/营业时间/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一步/ })).toBeInTheDocument();
  });

  test('应该显示输入提示', () => {
    render(<ShopInfoForm onSubmit={mockOnSubmit} />);

    expect(screen.getByPlaceholderText('请输入店铺名称')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('如：中式快餐、奶茶饮品等')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入详细地址')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('如：09:00-22:00')).toBeInTheDocument();
  });

  test('应该验证必填字段', async () => {
    const user = userEvent.setup();
    render(<ShopInfoForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /下一步/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('店铺名称不能为空')).toBeInTheDocument();
      expect(screen.getByText('经营品类不能为空')).toBeInTheDocument();
      expect(screen.getByText('店铺地址不能为空')).toBeInTheDocument();
      expect(screen.getByText('营业时间不能为空')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('应该验证营业时间格式', async () => {
    const user = userEvent.setup();
    render(<ShopInfoForm onSubmit={mockOnSubmit} />);

    const businessHoursInput = screen.getByLabelText(/营业时间/);
    await user.type(businessHoursInput, '9:00-22:00'); // 错误格式

    const submitButton = screen.getByRole('button', { name: /下一步/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/营业时间格式错误/)).toBeInTheDocument();
    });
  });

  test('应该接受有效的表单数据', async () => {
    const user = userEvent.setup();
    render(<ShopInfoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/店铺名称/), '测试餐厅');
    await user.type(screen.getByLabelText(/经营品类/), '中式快餐');
    await user.type(screen.getByLabelText(/店铺地址/), '北京市朝阳区测试街道123号');
    await user.type(screen.getByLabelText(/营业时间/), '09:00-22:00');

    const submitButton = screen.getByRole('button', { name: /下一步/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        shopName: '测试餐厅',
        category: '中式快餐',
        address: '北京市朝阳区测试街道123号',
        businessHours: '09:00-22:00'
      });
    });
  });

  test('应该清除字段错误当用户开始输入时', async () => {
    const user = userEvent.setup();
    render(<ShopInfoForm onSubmit={mockOnSubmit} />);

    // 触发验证错误
    const submitButton = screen.getByRole('button', { name: /下一步/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('店铺名称不能为空')).toBeInTheDocument();
    });

    // 开始输入应该清除错误
    const shopNameInput = screen.getByLabelText(/店铺名称/);
    await user.type(shopNameInput, '测试');

    await waitFor(() => {
      expect(screen.queryByText('店铺名称不能为空')).not.toBeInTheDocument();
    });
  });

  test('应该使用初始数据预填表单', () => {
    const initialData = {
      shopName: '初始餐厅',
      category: '初始品类',
      address: '初始地址',
      businessHours: '10:00-21:00'
    };

    render(<ShopInfoForm onSubmit={mockOnSubmit} initialData={initialData} />);

    expect(screen.getByDisplayValue('初始餐厅')).toBeInTheDocument();
    expect(screen.getByDisplayValue('初始品类')).toBeInTheDocument();
    expect(screen.getByDisplayValue('初始地址')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10:00-21:00')).toBeInTheDocument();
  });
});

describe('数据输入表单测试', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    (window.confirm as jest.Mock).mockClear();
  });

  test('应该渲染运营数据表单', () => {
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('店铺运营数据')).toBeInTheDocument();
    expect(screen.getByText('本周数据')).toBeInTheDocument();
    expect(screen.getByText('上周数据')).toBeInTheDocument();
    
    // 检查所有运营数据字段
    expect(screen.getAllByLabelText(/曝光人数/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/入店人数/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/入店转化率/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/下单转化率/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/下单人数/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/复购率/)).toHaveLength(2);
  });

  test('应该显示推广数据选项', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('点金推广数据（可选）')).toBeInTheDocument();
    
    const promotionCheckbox = screen.getByRole('checkbox');
    await user.click(promotionCheckbox);

    await waitFor(() => {
      expect(screen.getByText('本周推广数据')).toBeInTheDocument();
      expect(screen.getByText('上周推广数据')).toBeInTheDocument();
      expect(screen.getAllByLabelText(/推广花费/)).toHaveLength(2);
      expect(screen.getAllByLabelText(/推广曝光量/)).toHaveLength(2);
    });
  });

  test('应该验证数字输入格式', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
    
    // 输入非数字内容
    await user.type(exposureInput, 'abc');
    expect(exposureInput).toHaveValue(0); // 应该保持为0或处理无效输入

    // 输入有效数字
    await user.clear(exposureInput);
    await user.type(exposureInput, '1000');
    expect(exposureInput).toHaveValue(1000);
  });

  test('应该验证百分比字段范围', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    const conversionRateInput = screen.getAllByLabelText(/入店转化率/)[0];
    
    // 尝试输入超过100的值
    await user.type(conversionRateInput, '150');
    
    // 提交表单触发验证
    const submitButton = screen.getByRole('button', { name: /生成周报/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/不能超过100%/)).toBeInTheDocument();
    });
  });

  test('应该检测业务逻辑错误', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    // 输入入店人数大于曝光人数的错误数据
    const exposureInputs = screen.getAllByLabelText(/曝光人数/);
    const visitInputs = screen.getAllByLabelText(/入店人数/);

    await user.type(exposureInputs[0], '100');
    await user.type(visitInputs[0], '150'); // 入店人数超过曝光人数

    const submitButton = screen.getByRole('button', { name: /生成周报/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('入店人数不应超过曝光人数')
      );
    });
  });

  test('应该保存数据到localStorage', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
    await user.type(exposureInput, '1000');

    // 应该调用localStorage.setItem保存数据
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'reportForm_operationData',
      expect.stringContaining('"exposureCount":1000')
    );
  });

  test('应该从localStorage恢复数据', () => {
    const savedData = {
      thisWeek: {
        exposureCount: 2000,
        visitCount: 300,
        visitConversionRate: 15.0,
        orderConversionRate: 20.0,
        orderCount: 60,
        repurchaseRate: 25.0
      },
      lastWeek: {
        exposureCount: 1800,
        visitCount: 270,
        visitConversionRate: 15.0,
        orderConversionRate: 20.0,
        orderCount: 54,
        repurchaseRate: 22.0
      }
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));

    render(<DataInputForm onSubmit={mockOnSubmit} />);

    const exposureInputs = screen.getAllByLabelText(/曝光人数/);
    expect(exposureInputs[0]).toHaveValue(2000);
    expect(exposureInputs[1]).toHaveValue(1800);
  });

  test('应该清空表单数据', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    // 输入一些数据
    const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
    await user.type(exposureInput, '1000');

    // 点击清空按钮
    const clearButton = screen.getByRole('button', { name: /清空数据/ });
    await user.click(clearButton);

    expect(window.confirm).toHaveBeenCalledWith(
      '确定要清空所有表单数据吗？此操作不可撤销。'
    );

    await waitFor(() => {
      expect(exposureInput).toHaveValue(0);
    });
  });

  test('应该显示数据持久化提示', () => {
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('数据自动保存：')).toBeInTheDocument();
    expect(screen.getByText(/您的表单数据会自动保存到浏览器本地/)).toBeInTheDocument();
  });

  test('应该在提交时显示加载状态', async () => {
    const user = userEvent.setup();
    
    // 创建一个永不解决的Promise来模拟加载状态
    const mockSlowSubmit = jest.fn(() => new Promise(() => {}));
    
    render(<DataInputForm onSubmit={mockSlowSubmit} />);

    // 填写必要数据
    const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
    await user.type(exposureInput, '1000');

    const submitButton = screen.getByRole('button', { name: /生成周报/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('正在生成报告...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  test('应该正确处理推广数据验证', async () => {
    const user = userEvent.setup();
    render(<DataInputForm onSubmit={mockOnSubmit} />);

    // 启用推广数据
    const promotionCheckbox = screen.getByRole('checkbox');
    await user.click(promotionCheckbox);

    await waitFor(() => {
      expect(screen.getByText('本周推广数据')).toBeInTheDocument();
    });

    // 输入推广数据中的逻辑错误（进店量大于曝光量）
    const promoExposureInputs = screen.getAllByLabelText(/推广曝光量/);
    const promoVisitInputs = screen.getAllByLabelText(/推广进店量/);

    await user.type(promoExposureInputs[0], '100');
    await user.type(promoVisitInputs[0], '150');

    // 同时填写运营数据以使表单可提交
    const exposureInput = screen.getAllByLabelText(/曝光人数/)[0];
    await user.type(exposureInput, '1000');

    const submitButton = screen.getByRole('button', { name: /生成周报/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('推广进店量不应超过推广曝光量')
      );
    });
  });
});