import { z } from 'zod';

// 店铺基本信息验证
export const shopInfoSchema = z.object({
  shopName: z.string()
    .min(1, '店铺名称不能为空')
    .max(50, '店铺名称不能超过50个字符'),
  category: z.string()
    .min(1, '经营品类不能为空'),
  address: z.string()
    .min(1, '店铺地址不能为空')
    .max(200, '地址不能超过200个字符'),
  businessHours: z.string()
    .min(1, '营业时间不能为空')
    .regex(/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/, '营业时间格式错误，请使用"06:30 - 15:30"格式')
});

// 周期数据验证
export const periodDataSchema = z.object({
  exposureCount: z.number()
    .int('必须为整数')
    .min(0, '不能为负数'),
  visitCount: z.number()
    .int('必须为整数') 
    .min(0, '不能为负数'),
  visitConversionRate: z.number()
    .min(0, '不能为负数')
    .max(100, '不能超过100%'),
  orderConversionRate: z.number()
    .min(0, '不能为负数')
    .max(100, '不能超过100%'),
  orderCount: z.number()
    .int('必须为整数')
    .min(0, '不能为负数'),
  repurchaseRate: z.number()
    .min(0, '不能为负数')
    .max(100, '不能超过100%')
});

// 运营数据验证
export const operationDataSchema = z.object({
  thisWeek: periodDataSchema,
  lastWeek: periodDataSchema
});

// 推广数据验证
export const promotionDataSchema = z.object({
  thisWeek: z.object({
    cost: z.number().min(0, '费用不能为负数'),
    exposureCount: z.number().int().min(0, '曝光量不能为负数'),
    visitCount: z.number().int().min(0, '进店量不能为负数'),
    visitRate: z.number().min(0).max(100, '进店率应在0-100%之间'),
    costPerVisit: z.number().min(0, '单次成本不能为负数')
  }),
  lastWeek: z.object({
    cost: z.number().min(0, '费用不能为负数'),
    exposureCount: z.number().int().min(0, '曝光量不能为负数'),
    visitCount: z.number().int().min(0, '进店量不能为负数'),
    visitRate: z.number().min(0).max(100, '进店率应在0-100%之间'),
    costPerVisit: z.number().min(0, '单次成本不能为负数')
  })
});

// 业务逻辑验证函数
export const validateBusinessLogic = {
  // 检查数据一致性
  checkDataConsistency: (exposureCount: number, visitCount: number, orderCount: number): string[] => {
    const errors: string[] = [];
    
    if (visitCount > exposureCount && exposureCount > 0) {
      errors.push('入店人数不应超过曝光人数');
    }
    
    if (orderCount > visitCount && visitCount > 0) {
      errors.push('下单人数不应超过入店人数');
    }
    
    return errors;
  },

  // 验证转化率计算的准确性
  validateConversionRate: (actual: number, expected: number, tolerance: number = 5): boolean => {
    return Math.abs(actual - expected) <= tolerance;
  },

  // 计算实际转化率
  calculateVisitConversionRate: (visitCount: number, exposureCount: number): number => {
    return exposureCount > 0 ? (visitCount / exposureCount) * 100 : 0;
  },

  calculateOrderConversionRate: (orderCount: number, visitCount: number): number => {
    return visitCount > 0 ? (orderCount / visitCount) * 100 : 0;
  },

  // 检查数据合理性范围
  checkReasonableRanges: {
    visitConversionRate: (rate: number): boolean => rate >= 0 && rate <= 100,
    orderConversionRate: (rate: number): boolean => rate >= 0 && rate <= 100,
    repurchaseRate: (rate: number): boolean => rate >= 0 && rate <= 100,
    promotionVisitRate: (rate: number): boolean => rate >= 0 && rate <= 100
  },

  // 数据异常检测
  detectAnomalies: {
    // 检测周同比变化是否异常（超过500%视为异常）
    weekOverWeekChange: (thisWeek: number, lastWeek: number): boolean => {
      if (lastWeek === 0) return false;
      const changeRate = Math.abs((thisWeek - lastWeek) / lastWeek);
      return changeRate > 5; // 超过500%变化
    },

    // 检测转化率是否异常高
    unusuallyHighConversionRate: (rate: number, type: 'visit' | 'order'): boolean => {
      const thresholds = {
        visit: 50, // 入店转化率超过50%可能异常
        order: 30  // 下单转化率超过30%可能异常
      };
      return rate > thresholds[type];
    }
  }
};