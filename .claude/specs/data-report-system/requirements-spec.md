# 数据统计周报系统技术实现规格

## 问题描述

**业务问题**: 美团外卖店铺运营者需要一个便捷的工具来生成专业的数据统计周报，用于分析店铺运营表现和制定改进策略。

**当前状态**: 店铺运营者缺乏标准化的数据报告工具，需要手动整理各类运营数据，无法快速生成结构化的数据分析报告。

**期望结果**: 提供一个Web应用程序，允许用户输入店铺基本信息和运营数据，自动调用AI生成包含图表、表格和分析文字的专业HTML周报。

## 解决方案概览

**方法**: 构建基于Next.js的单页面Web应用，使用表单收集数据，集成Gemini API生成智能化的HTML报告。

**核心变更**: 
- 创建数据输入表单组件，包含店铺信息和运营数据录入
- 实现Gemini API集成，使用专业的提示词模板生成报告
- 设计报告展示和下载功能
- 实现数据验证和错误处理机制

**成功标准**: 
- 用户能够完整录入所有必需数据
- 系统能够成功调用API并生成专业报告
- 报告包含完整的数据分析、图表和改进建议
- 应用具有良好的用户体验和错误处理

## 技术实现

### 项目结构
```
数据周报系统/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── generate-report/
│           └── route.ts
├── components/
│   ├── ui/                    # shadcn/ui组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   └── toast.tsx
│   ├── ShopInfoForm.tsx       # 店铺基本信息表单
│   ├── DataInputForm.tsx      # 数据输入表单
│   ├── ReportDisplay.tsx      # 报告展示组件
│   └── LoadingSpinner.tsx     # 加载状态组件
├── lib/
│   ├── types.ts              # TypeScript类型定义
│   ├── validations.ts        # 表单验证规则
│   ├── api-client.ts         # API客户端
│   ├── prompt-templates.ts   # AI提示词模板
│   └── utils.ts             # 工具函数
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── components.json           # shadcn/ui配置
```

### 数据结构定义

**文件**: `lib/types.ts`
```typescript
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
```

### 表单验证规则

**文件**: `lib/validations.ts`
```typescript
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
    .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, '营业时间格式错误，请使用HH:MM-HH:MM格式')
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
```

### API客户端

**文件**: `lib/api-client.ts`
```typescript
import { ReportData, APIResponse } from './types';

export class APIClient {
  private readonly baseUrl = 'https://haxiaiplus.cn/v1/chat/completions';
  private readonly model = 'gemini-2.5-flash-lite-preview-06-17';

  async generateReport(data: ReportData, apiKey: string): Promise<APIResponse> {
    try {
      const prompt = this.buildPrompt(data);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.choices && result.choices[0]?.message?.content) {
        return {
          success: true,
          data: result.choices[0].message.content
        };
      } else {
        throw new Error('API返回格式错误');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private buildPrompt(data: ReportData): string {
    // 使用预定义的提示词模板
    return buildReportPrompt(data);
  }
}
```

### AI提示词模板

**文件**: `lib/prompt-templates.ts`
```typescript
import { ReportData } from './types';

export function buildReportPrompt(data: ReportData): string {
  const { shopInfo, operationData, promotionData } = data;
  
  // 计算数据变化
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  const exposureChange = calculateChange(
    operationData.thisWeek.exposureCount, 
    operationData.lastWeek.exposureCount
  );
  const visitChange = calculateChange(
    operationData.thisWeek.visitCount,
    operationData.lastWeek.visitCount
  );
  const orderChange = calculateChange(
    operationData.thisWeek.orderCount,
    operationData.lastWeek.orderCount
  );

  let promotionSection = '';
  if (promotionData) {
    const costChange = calculateChange(promotionData.thisWeek.cost, promotionData.lastWeek.cost);
    const promoteExposureChange = calculateChange(
      promotionData.thisWeek.exposureCount,
      promotionData.lastWeek.exposureCount
    );
    
    promotionSection = `
### 点金推广数据分析
- 本周推广花费：¥${promotionData.thisWeek.cost}（${costChange}）
- 推广曝光量：${promotionData.thisWeek.exposureCount}（${promoteExposureChange}）
- 推广进店量：${promotionData.thisWeek.visitCount}
- 进店率：${promotionData.thisWeek.visitRate}%
- 单次进店成本：¥${promotionData.thisWeek.costPerVisit}
    `;
  }

  return `
你是一名专业的美团外卖运营分析师，请为以下店铺生成一份详细的数据周报。报告需要包含数据分析、趋势判断和具体的运营建议。

## 店铺信息
- 店铺名称：${shopInfo.shopName}
- 经营品类：${shopInfo.category}
- 店铺地址：${shopInfo.address}
- 营业时间：${shopInfo.businessHours}

## 本周运营数据
- 曝光人数：${operationData.thisWeek.exposureCount}人（${exposureChange}）
- 入店人数：${operationData.thisWeek.visitCount}人（${visitChange}）
- 入店转化率：${operationData.thisWeek.visitConversionRate}%
- 下单转化率：${operationData.thisWeek.orderConversionRate}%
- 下单人数：${operationData.thisWeek.orderCount}人（${orderChange}）
- 复购率：${operationData.thisWeek.repurchaseRate}%

## 上周对比数据
- 曝光人数：${operationData.lastWeek.exposureCount}人
- 入店人数：${operationData.lastWeek.visitCount}人
- 入店转化率：${operationData.lastWeek.visitConversionRate}%
- 下单转化率：${operationData.lastWeek.orderConversionRate}%
- 下单人数：${operationData.lastWeek.orderCount}人
- 复购率：${operationData.lastWeek.repurchaseRate}%

${promotionSection}

请生成一份完整的HTML格式周报，要求：

1. **报告结构**：
   - 标题和店铺基本信息
   - 核心数据总览（使用表格）
   - 数据趋势分析（包含变化百分比）
   - 关键指标分析
   - 问题诊断和改进建议
   - 下周行动计划

2. **数据可视化**：
   - 使用HTML表格展示核心数据对比
   - 用颜色区分增长（绿色）和下降（红色）趋势
   - 突出显示关键指标和重要变化

3. **专业分析**：
   - 基于美团外卖运营经验提供深度分析
   - 识别数据异常和机会点
   - 提供具体可执行的改进措施
   - 给出ROI分析和效果预期

4. **HTML样式**：
   - 使用内联CSS样式
   - 确保在浏览器中显示美观
   - 适合打印和分享
   - 使用专业的商务风格

请确保报告内容专业、数据准确、建议实用。返回完整的HTML代码。
  `;
}
```

### 核心组件实现

**文件**: `components/ShopInfoForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { ShopBasicInfo } from '@/lib/types';
import { shopInfoSchema } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ShopInfoFormProps {
  onSubmit: (data: ShopBasicInfo) => void;
  initialData?: ShopBasicInfo;
}

export function ShopInfoForm({ onSubmit, initialData }: ShopInfoFormProps) {
  const [formData, setFormData] = useState<ShopBasicInfo>(
    initialData || {
      shopName: '',
      category: '',
      address: '',
      businessHours: ''
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = shopInfoSchema.parse(formData);
      setErrors({});
      onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleInputChange = (field: keyof ShopBasicInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>店铺基本信息</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="shopName">店铺名称 *</Label>
            <Input
              id="shopName"
              value={formData.shopName}
              onChange={(e) => handleInputChange('shopName', e.target.value)}
              placeholder="请输入店铺名称"
              className={errors.shopName ? 'border-red-500' : ''}
            />
            {errors.shopName && (
              <p className="text-sm text-red-500 mt-1">{errors.shopName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">经营品类 *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="如：中式快餐、奶茶饮品等"
              className={errors.category ? 'border-red-500' : ''}
            />
            {errors.category && (
              <p className="text-sm text-red-500 mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">店铺地址 *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="请输入详细地址"
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <Label htmlFor="businessHours">营业时间 *</Label>
            <Input
              id="businessHours"
              value={formData.businessHours}
              onChange={(e) => handleInputChange('businessHours', e.target.value)}
              placeholder="如：09:00-22:00"
              className={errors.businessHours ? 'border-red-500' : ''}
            />
            {errors.businessHours && (
              <p className="text-sm text-red-500 mt-1">{errors.businessHours}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            下一步
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**文件**: `components/DataInputForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { ShopOperationData, PromotionData } from '@/lib/types';
import { operationDataSchema, promotionDataSchema } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface DataInputFormProps {
  onSubmit: (operationData: ShopOperationData, promotionData?: PromotionData) => void;
}

export function DataInputForm({ onSubmit }: DataInputFormProps) {
  const [operationData, setOperationData] = useState<ShopOperationData>({
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
  });

  const [includePromotion, setIncludePromotion] = useState(false);
  const [promotionData, setPromotionData] = useState<PromotionData>({
    thisWeek: {
      cost: 0,
      exposureCount: 0,
      visitCount: 0,
      visitRate: 0,
      costPerVisit: 0
    },
    lastWeek: {
      cost: 0,
      exposureCount: 0,
      visitCount: 0,
      visitRate: 0,
      costPerVisit: 0
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedOperationData = operationDataSchema.parse(operationData);
      let validatedPromotionData: PromotionData | undefined;
      
      if (includePromotion) {
        validatedPromotionData = promotionDataSchema.parse(promotionData);
      }
      
      setErrors({});
      onSubmit(validatedOperationData, validatedPromotionData);
    } catch (error) {
      // 处理验证错误
      console.error('Validation error:', error);
    }
  };

  // 输入字段组件
  const NumberInput = ({ 
    label, 
    value, 
    onChange, 
    isPercentage = false,
    isInteger = false 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    isPercentage?: boolean;
    isInteger?: boolean;
  }) => (
    <div>
      <Label>{label} {isPercentage && '(%)'}</Label>
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => {
          const val = parseFloat(e.target.value) || 0;
          onChange(isInteger ? Math.floor(val) : val);
        }}
        step={isInteger ? 1 : 0.1}
        min={0}
        max={isPercentage ? 100 : undefined}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 运营数据表单 */}
      <Card>
        <CardHeader>
          <CardTitle>店铺运营数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* 本周数据 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">本周数据</h3>
              <div className="space-y-4">
                <NumberInput
                  label="曝光人数"
                  value={operationData.thisWeek.exposureCount}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    thisWeek: { ...prev.thisWeek, exposureCount: val }
                  }))}
                  isInteger
                />
                <NumberInput
                  label="入店人数"
                  value={operationData.thisWeek.visitCount}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    thisWeek: { ...prev.thisWeek, visitCount: val }
                  }))}
                  isInteger
                />
                <NumberInput
                  label="入店转化率"
                  value={operationData.thisWeek.visitConversionRate}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    thisWeek: { ...prev.thisWeek, visitConversionRate: val }
                  }))}
                  isPercentage
                />
                <NumberInput
                  label="下单转化率"
                  value={operationData.thisWeek.orderConversionRate}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    thisWeek: { ...prev.thisWeek, orderConversionRate: val }
                  }))}
                  isPercentage
                />
                <NumberInput
                  label="下单人数"
                  value={operationData.thisWeek.orderCount}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    thisWeek: { ...prev.thisWeek, orderCount: val }
                  }))}
                  isInteger
                />
                <NumberInput
                  label="复购率"
                  value={operationData.thisWeek.repurchaseRate}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    thisWeek: { ...prev.thisWeek, repurchaseRate: val }
                  }))}
                  isPercentage
                />
              </div>
            </div>

            {/* 上周数据 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">上周数据</h3>
              <div className="space-y-4">
                <NumberInput
                  label="曝光人数"
                  value={operationData.lastWeek.exposureCount}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    lastWeek: { ...prev.lastWeek, exposureCount: val }
                  }))}
                  isInteger
                />
                <NumberInput
                  label="入店人数"
                  value={operationData.lastWeek.visitCount}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    lastWeek: { ...prev.lastWeek, visitCount: val }
                  }))}
                  isInteger
                />
                <NumberInput
                  label="入店转化率"
                  value={operationData.lastWeek.visitConversionRate}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    lastWeek: { ...prev.lastWeek, visitConversionRate: val }
                  }))}
                  isPercentage
                />
                <NumberInput
                  label="下单转化率"
                  value={operationData.lastWeek.orderConversionRate}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    lastWeek: { ...prev.lastWeek, orderConversionRate: val }
                  }))}
                  isPercentage
                />
                <NumberInput
                  label="下单人数"
                  value={operationData.lastWeek.orderCount}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    lastWeek: { ...prev.lastWeek, orderCount: val }
                  }))}
                  isInteger
                />
                <NumberInput
                  label="复购率"
                  value={operationData.lastWeek.repurchaseRate}
                  onChange={(val) => setOperationData(prev => ({
                    ...prev,
                    lastWeek: { ...prev.lastWeek, repurchaseRate: val }
                  }))}
                  isPercentage
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 点金推广数据（可选） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Checkbox
              checked={includePromotion}
              onCheckedChange={setIncludePromotion}
            />
            <span>点金推广数据（可选）</span>
          </CardTitle>
        </CardHeader>
        {includePromotion && (
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* 本周推广数据 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">本周推广数据</h3>
                <div className="space-y-4">
                  <NumberInput
                    label="推广花费 (¥)"
                    value={promotionData.thisWeek.cost}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      thisWeek: { ...prev.thisWeek, cost: val }
                    }))}
                  />
                  <NumberInput
                    label="推广曝光量"
                    value={promotionData.thisWeek.exposureCount}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      thisWeek: { ...prev.thisWeek, exposureCount: val }
                    }))}
                    isInteger
                  />
                  <NumberInput
                    label="推广进店量"
                    value={promotionData.thisWeek.visitCount}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      thisWeek: { ...prev.thisWeek, visitCount: val }
                    }))}
                    isInteger
                  />
                  <NumberInput
                    label="进店率"
                    value={promotionData.thisWeek.visitRate}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      thisWeek: { ...prev.thisWeek, visitRate: val }
                    }))}
                    isPercentage
                  />
                  <NumberInput
                    label="单次进店成本 (¥)"
                    value={promotionData.thisWeek.costPerVisit}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      thisWeek: { ...prev.thisWeek, costPerVisit: val }
                    }))}
                  />
                </div>
              </div>

              {/* 上周推广数据 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">上周推广数据</h3>
                <div className="space-y-4">
                  <NumberInput
                    label="推广花费 (¥)"
                    value={promotionData.lastWeek.cost}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      lastWeek: { ...prev.lastWeek, cost: val }
                    }))}
                  />
                  <NumberInput
                    label="推广曝光量"
                    value={promotionData.lastWeek.exposureCount}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      lastWeek: { ...prev.lastWeek, exposureCount: val }
                    }))}
                    isInteger
                  />
                  <NumberInput
                    label="推广进店量"
                    value={promotionData.lastWeek.visitCount}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      lastWeek: { ...prev.lastWeek, visitCount: val }
                    }))}
                    isInteger
                  />
                  <NumberInput
                    label="进店率"
                    value={promotionData.lastWeek.visitRate}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      lastWeek: { ...prev.lastWeek, visitRate: val }
                    }))}
                    isPercentage
                  />
                  <NumberInput
                    label="单次进店成本 (¥)"
                    value={promotionData.lastWeek.costPerVisit}
                    onChange={(val) => setPromotionData(prev => ({
                      ...prev,
                      lastWeek: { ...prev.lastWeek, costPerVisit: val }
                    }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Button onClick={handleSubmit} className="w-full" size="lg">
        生成周报
      </Button>
    </div>
  );
}
```

### API路由实现

**文件**: `app/api/generate-report/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { APIClient } from '@/lib/api-client';
import { ReportData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData, apiKey } = body;

    if (!reportData || !apiKey) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const client = new APIClient();
    const result = await client.generateReport(reportData as ReportData, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
```

### 主页面实现

**文件**: `app/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { ShopBasicInfo, ShopOperationData, PromotionData, ReportData } from '@/lib/types';
import { ShopInfoForm } from '@/components/ShopInfoForm';
import { DataInputForm } from '@/components/DataInputForm';
import { ReportDisplay } from '@/components/ReportDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Step = 'shop-info' | 'data-input' | 'api-key' | 'generating' | 'report';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<Step>('shop-info');
  const [shopInfo, setShopInfo] = useState<ShopBasicInfo | null>(null);
  const [operationData, setOperationData] = useState<ShopOperationData | null>(null);
  const [promotionData, setPromotionData] = useState<PromotionData | undefined>(undefined);
  const [apiKey, setApiKey] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [error, setError] = useState('');

  const handleShopInfoSubmit = (data: ShopBasicInfo) => {
    setShopInfo(data);
    setCurrentStep('data-input');
  };

  const handleDataSubmit = (operation: ShopOperationData, promotion?: PromotionData) => {
    setOperationData(operation);
    setPromotionData(promotion);
    setCurrentStep('api-key');
  };

  const handleGenerateReport = async () => {
    if (!shopInfo || !operationData || !apiKey.trim()) {
      setError('数据不完整，请检查输入');
      return;
    }

    setCurrentStep('generating');
    setError('');

    const reportData: ReportData = {
      shopInfo,
      operationData,
      promotionData,
      generatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportData,
          apiKey: apiKey.trim()
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setReportHtml(result.data);
        setCurrentStep('report');
      } else {
        setError(result.error || '生成报告失败');
        setCurrentStep('api-key');
      }
    } catch (error) {
      setError('网络请求失败，请检查网络连接');
      setCurrentStep('api-key');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'shop-info':
        return <ShopInfoForm onSubmit={handleShopInfoSubmit} />;
      
      case 'data-input':
        return <DataInputForm onSubmit={handleDataSubmit} />;
      
      case 'api-key':
        return (
          <Card>
            <CardHeader>
              <CardTitle>API配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API密钥 *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的API密钥"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('data-input')}
                >
                  上一步
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={!apiKey.trim()}
                  className="flex-1"
                >
                  生成报告
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'generating':
        return <LoadingSpinner message="正在生成报告，请稍候..." />;
      
      case 'report':
        return (
          <ReportDisplay 
            htmlContent={reportHtml}
            onBackToForm={() => {
              setCurrentStep('shop-info');
              setReportHtml('');
              setError('');
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            美团外卖数据统计周报系统
          </h1>
          <p className="text-gray-600">
            输入店铺数据，自动生成专业的运营分析报告
          </p>
        </div>

        {/* 进度指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { key: 'shop-info', label: '店铺信息' },
              { key: 'data-input', label: '数据录入' },
              { key: 'api-key', label: 'API配置' },
              { key: 'report', label: '生成报告' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.key 
                    ? 'bg-blue-600 text-white' 
                    : ['shop-info', 'data-input', 'api-key'].indexOf(currentStep) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === step.key ? 'text-blue-600 font-medium' : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
                {index < 3 && (
                  <div className="w-8 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
}
```

## 实施顺序

### 阶段1：基础设施搭建
1. 初始化Next.js项目和依赖包安装
2. 配置Tailwind CSS和shadcn/ui组件库
3. 创建基础项目结构和类型定义
4. 实现表单验证规则和工具函数

### 阶段2：核心组件开发
1. 开发店铺信息表单组件（ShopInfoForm）
2. 开发数据输入表单组件（DataInputForm）
3. 实现表单验证和错误处理机制
4. 创建加载状态和用户反馈组件

### 阶段3：API集成
1. 实现API客户端类和请求处理
2. 开发AI提示词模板系统
3. 创建API路由处理程序
4. 实现错误处理和重试机制

### 阶段4：报告展示和主流程
1. 开发报告展示组件（ReportDisplay）
2. 实现主页面流程控制逻辑
3. 添加进度指示器和用户导航
4. 实现报告下载和分享功能

### 阶段5：优化和测试
1. 性能优化和代码审查
2. 用户体验改进和界面优化
3. 错误处理完善和边界情况测试
4. 部署准备和最终验证

## 验证计划

### 单元测试
- 表单验证逻辑测试：验证所有验证规则正确执行
- API客户端测试：模拟各种API响应场景
- 数据处理函数测试：确保数据计算和格式化正确
- 组件渲染测试：验证组件在各种状态下正确显示

### 集成测试
- 完整流程测试：从数据输入到报告生成的端到端流程
- API集成测试：验证与Gemini API的实际集成
- 错误处理测试：验证各种错误场景的处理
- 用户交互测试：验证表单提交和页面导航

### 业务逻辑验证
- 数据准确性验证：确保生成的报告数据计算正确
- 报告质量验证：验证AI生成的报告内容专业性和实用性
- 用户体验验证：确保界面友好、操作简便
- 性能验证：确保页面加载速度和API响应时间合理

该技术规格文档提供了完整的实施蓝图，包含所有必要的技术细节、文件结构和实现逻辑，可直接用于代码生成和开发实施。