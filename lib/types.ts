// 店铺基本信息
export interface ShopBasicInfo {
  shopName: string;          // 店铺名称（必填）
  category: string;          // 经营品类（必填）
  address: string;           // 店铺地址（必填）
  businessHours: string;     // 营业时间（必填）
}

// 周期数据
export interface PeriodData {
  exposureCount: number;        // 曝光人数
  visitCount: number;          // 入店人数  
  visitConversionRate: number; // 入店转化率(%)
  orderConversionRate: number; // 下单转化率(%)
  orderCount: number;          // 下单人数
  repurchaseRate: number;      // 复购率(%)
}

// 店铺运营数据
export interface ShopOperationData {
  thisWeek: PeriodData;        // 本周数据
  lastWeek: PeriodData;        // 上周数据
}

// 点金推广数据
export interface PromotionData {
  thisWeek: {
    cost: number;              // 推广花费
    exposureCount: number;     // 推广曝光量
    visitCount: number;        // 推广进店量
    visitRate: number;         // 进店率(%)
    costPerVisit: number;      // 单次进店成本
  };
  lastWeek: {
    cost: number;
    exposureCount: number;
    visitCount: number;
    visitRate: number;
    costPerVisit: number;
  };
}

// 完整报告数据
export interface ReportData {
  shopInfo: ShopBasicInfo;
  operationData: ShopOperationData;
  promotionData?: PromotionData; // 可选
  generatedAt: string;
}

// API响应类型
export interface APIResponse {
  success: boolean;
  data?: string;              // HTML报告内容
  error?: string;
}