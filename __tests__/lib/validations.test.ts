/**
 * 验证模块测试套件
 * 测试表单验证规则和业务逻辑验证
 */

import { z } from 'zod';
import {
  shopInfoSchema,
  periodDataSchema,
  operationDataSchema,
  promotionDataSchema,
  validateBusinessLogic
} from '../../lib/validations';

describe('表单验证测试', () => {
  describe('店铺信息验证 (shopInfoSchema)', () => {
    test('应该通过有效的店铺信息', () => {
      const validShopInfo = {
        shopName: '测试餐厅',
        category: '中式快餐',
        address: '北京市朝阳区测试街道123号',
        businessHours: '09:00-22:00'
      };

      expect(() => shopInfoSchema.parse(validShopInfo)).not.toThrow();
    });

    test('应该拒绝空的店铺名称', () => {
      const invalidShopInfo = {
        shopName: '',
        category: '中式快餐',
        address: '北京市朝阳区测试街道123号',
        businessHours: '09:00-22:00'
      };

      expect(() => shopInfoSchema.parse(invalidShopInfo)).toThrow('店铺名称不能为空');
    });

    test('应该拒绝过长的店铺名称', () => {
      const invalidShopInfo = {
        shopName: 'a'.repeat(51), // 超过50字符限制
        category: '中式快餐',
        address: '北京市朝阳区测试街道123号',
        businessHours: '09:00-22:00'
      };

      expect(() => shopInfoSchema.parse(invalidShopInfo)).toThrow('店铺名称不能超过50个字符');
    });

    test('应该验证营业时间格式', () => {
      const validFormats = [
        '09:00-22:00',
        '00:00-23:59',
        '08:30-18:30'
      ];

      const invalidFormats = [
        '9:00-22:00',    // 小时格式不正确
        '09:0-22:00',    // 分钟格式不正确
        '09:00-22',      // 结束时间格式不完整
        '09:00 22:00',   // 缺少连字符
        '24:00-25:00'    // 超过24小时
      ];

      validFormats.forEach(format => {
        const shopInfo = {
          shopName: '测试餐厅',
          category: '中式快餐',
          address: '北京市朝阳区测试街道123号',
          businessHours: format
        };
        expect(() => shopInfoSchema.parse(shopInfo)).not.toThrow();
      });

      invalidFormats.forEach(format => {
        const shopInfo = {
          shopName: '测试餐厅',
          category: '中式快餐',
          address: '北京市朝阳区测试街道123号',
          businessHours: format
        };
        expect(() => shopInfoSchema.parse(shopInfo)).toThrow();
      });
    });
  });

  describe('周期数据验证 (periodDataSchema)', () => {
    test('应该通过有效的周期数据', () => {
      const validPeriodData = {
        exposureCount: 1000,
        visitCount: 150,
        visitConversionRate: 15.0,
        orderConversionRate: 20.5,
        orderCount: 30,
        repurchaseRate: 25.8
      };

      expect(() => periodDataSchema.parse(validPeriodData)).not.toThrow();
    });

    test('应该拒绝负数值', () => {
      const invalidData = [
        { exposureCount: -100, visitCount: 50, visitConversionRate: 15, orderConversionRate: 20, orderCount: 10, repurchaseRate: 25 },
        { exposureCount: 100, visitCount: -50, visitConversionRate: 15, orderConversionRate: 20, orderCount: 10, repurchaseRate: 25 },
        { exposureCount: 100, visitCount: 50, visitConversionRate: -15, orderConversionRate: 20, orderCount: 10, repurchaseRate: 25 }
      ];

      invalidData.forEach(data => {
        expect(() => periodDataSchema.parse(data)).toThrow('不能为负数');
      });
    });

    test('应该拒绝超过100%的转化率', () => {
      const invalidData = {
        exposureCount: 100,
        visitCount: 50,
        visitConversionRate: 150, // 超过100%
        orderConversionRate: 20,
        orderCount: 10,
        repurchaseRate: 25
      };

      expect(() => periodDataSchema.parse(invalidData)).toThrow('不能超过100%');
    });

    test('应该要求整数类型的字段为整数', () => {
      const invalidData = {
        exposureCount: 100.5, // 应该是整数
        visitCount: 50,
        visitConversionRate: 15,
        orderConversionRate: 20,
        orderCount: 10,
        repurchaseRate: 25
      };

      expect(() => periodDataSchema.parse(invalidData)).toThrow('必须为整数');
    });
  });

  describe('推广数据验证 (promotionDataSchema)', () => {
    test('应该通过有效的推广数据', () => {
      const validPromotionData = {
        thisWeek: {
          cost: 500.50,
          exposureCount: 2000,
          visitCount: 100,
          visitRate: 5.0,
          costPerVisit: 5.01
        },
        lastWeek: {
          cost: 450.30,
          exposureCount: 1800,
          visitCount: 90,
          visitRate: 5.0,
          costPerVisit: 5.00
        }
      };

      expect(() => promotionDataSchema.parse(validPromotionData)).not.toThrow();
    });

    test('应该拒绝负数费用', () => {
      const invalidData = {
        thisWeek: {
          cost: -100, // 负数费用
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
      };

      expect(() => promotionDataSchema.parse(invalidData)).toThrow('费用不能为负数');
    });
  });
});

describe('业务逻辑验证测试', () => {
  describe('数据一致性检查', () => {
    test('应该检测出入店人数超过曝光人数的错误', () => {
      const errors = validateBusinessLogic.checkDataConsistency(100, 150, 30);
      expect(errors).toContain('入店人数不应超过曝光人数');
    });

    test('应该检测出下单人数超过入店人数的错误', () => {
      const errors = validateBusinessLogic.checkDataConsistency(1000, 150, 200);
      expect(errors).toContain('下单人数不应超过入店人数');
    });

    test('应该通过正常的数据层次关系', () => {
      const errors = validateBusinessLogic.checkDataConsistency(1000, 150, 30);
      expect(errors).toHaveLength(0);
    });

    test('应该处理曝光人数为0的边界情况', () => {
      const errors = validateBusinessLogic.checkDataConsistency(0, 0, 0);
      expect(errors).toHaveLength(0);
    });
  });

  describe('转化率计算验证', () => {
    test('应该正确计算入店转化率', () => {
      const rate = validateBusinessLogic.calculateVisitConversionRate(150, 1000);
      expect(rate).toBe(15);
    });

    test('应该正确计算下单转化率', () => {
      const rate = validateBusinessLogic.calculateOrderConversionRate(30, 150);
      expect(rate).toBe(20);
    });

    test('应该处理除零情况', () => {
      const visitRate = validateBusinessLogic.calculateVisitConversionRate(100, 0);
      const orderRate = validateBusinessLogic.calculateOrderConversionRate(50, 0);
      
      expect(visitRate).toBe(0);
      expect(orderRate).toBe(0);
    });

    test('应该验证转化率在合理误差范围内', () => {
      const isValid = validateBusinessLogic.validateConversionRate(15.2, 15.0, 1);
      expect(isValid).toBe(true);

      const isInvalid = validateBusinessLogic.validateConversionRate(20.0, 15.0, 1);
      expect(isInvalid).toBe(false);
    });
  });

  describe('数据合理性范围检查', () => {
    test('应该验证转化率在0-100%范围内', () => {
      expect(validateBusinessLogic.checkReasonableRanges.visitConversionRate(50)).toBe(true);
      expect(validateBusinessLogic.checkReasonableRanges.visitConversionRate(-1)).toBe(false);
      expect(validateBusinessLogic.checkReasonableRanges.visitConversionRate(101)).toBe(false);
    });

    test('应该验证各种转化率类型', () => {
      const { checkReasonableRanges } = validateBusinessLogic;
      
      expect(checkReasonableRanges.orderConversionRate(30)).toBe(true);
      expect(checkReasonableRanges.repurchaseRate(25)).toBe(true);
      expect(checkReasonableRanges.promotionVisitRate(10)).toBe(true);
      
      expect(checkReasonableRanges.orderConversionRate(150)).toBe(false);
      expect(checkReasonableRanges.repurchaseRate(-5)).toBe(false);
    });
  });

  describe('数据异常检测', () => {
    test('应该检测周同比变化异常', () => {
      // 超过500%的变化视为异常
      const isAbnormal1 = validateBusinessLogic.detectAnomalies.weekOverWeekChange(1000, 100);
      expect(isAbnormal1).toBe(true);

      // 正常范围内的变化
      const isNormal = validateBusinessLogic.detectAnomalies.weekOverWeekChange(120, 100);
      expect(isNormal).toBe(false);

      // 上周为0的边界情况
      const isBoundary = validateBusinessLogic.detectAnomalies.weekOverWeekChange(100, 0);
      expect(isBoundary).toBe(false);
    });

    test('应该检测异常高的转化率', () => {
      const { detectAnomalies } = validateBusinessLogic;
      
      // 异常高的入店转化率（>50%）
      expect(detectAnomalies.unusuallyHighConversionRate(60, 'visit')).toBe(true);
      expect(detectAnomalies.unusuallyHighConversionRate(30, 'visit')).toBe(false);
      
      // 异常高的下单转化率（>30%）
      expect(detectAnomalies.unusuallyHighConversionRate(40, 'order')).toBe(true);
      expect(detectAnomalies.unusuallyHighConversionRate(25, 'order')).toBe(false);
    });
  });
});

describe('边界值和极端情况测试', () => {
  test('应该处理最大整数边界值', () => {
    const maxIntData = {
      exposureCount: Number.MAX_SAFE_INTEGER,
      visitCount: 0,
      visitConversionRate: 0,
      orderConversionRate: 0,
      orderCount: 0,
      repurchaseRate: 0
    };

    expect(() => periodDataSchema.parse(maxIntData)).not.toThrow();
  });

  test('应该处理小数精度', () => {
    const preciseData = {
      exposureCount: 1000,
      visitCount: 150,
      visitConversionRate: 15.123456789,
      orderConversionRate: 20.987654321,
      orderCount: 30,
      repurchaseRate: 25.555555555
    };

    expect(() => periodDataSchema.parse(preciseData)).not.toThrow();
  });

  test('应该处理零值数据', () => {
    const zeroData = {
      exposureCount: 0,
      visitCount: 0,
      visitConversionRate: 0,
      orderConversionRate: 0,
      orderCount: 0,
      repurchaseRate: 0
    };

    expect(() => periodDataSchema.parse(zeroData)).not.toThrow();
    
    const errors = validateBusinessLogic.checkDataConsistency(0, 0, 0);
    expect(errors).toHaveLength(0);
  });
});