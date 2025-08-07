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
  adjustmentData?: ShopAdjustmentData; // 可选
  generatedAt: string;
}

// 店铺调整项目选项
export enum ShopAdjustmentOption {
  MARKET_RESEARCH = '商圈调研和店铺方案的制定',
  STORE_DESIGN = '店招海报头像的设计并上线',
  CATEGORY_OPTIMIZATION = '分类栏优化并上线',
  KEYWORD_OPTIMIZATION = '全店产品关键词优化并上线',
  PRODUCT_DESCRIPTION = '全店菜品描述并上线',
  REVIEW_MANAGEMENT = '评价解释差评申诉维护',
  IMAGE_WALL = '图片墙设计并上线',
  ANIMATED_IMAGES = '动图设计并上线',
  BRAND_STORY = '品牌故事设计并上线',
  STORE_IMAGES = '全店图设计并上线',
  PRECISION_MARKETING = '精准营销发券',
  DAILY_REPORTS = '每日群发简报',
  WEEKLY_ANALYSIS = '店铺数据周报分析',
  STORE_ANALYSIS = '店铺分解析',
  NEW_PRODUCTS = '新品上线和优化',
  ROI_ADJUSTMENT = '点金推广的ROI调整',
  VIDEO_STORE_SIGN = '视频店招的制作并上线'
}

// 店铺调整项目数据
export interface ShopAdjustmentData {
  thisWeekAdjustments: ShopAdjustmentOption[];
  lastWeekAdjustments: ShopAdjustmentOption[];
}

// API响应类型
export interface APIResponse {
  success: boolean;
  data?: string;              // HTML报告内容
  error?: string;
}