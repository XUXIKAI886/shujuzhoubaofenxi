'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { ShopOperationData, PromotionData, ShopAdjustmentData, ShopAdjustmentOption } from '@/lib/types';
import { operationDataSchema, promotionDataSchema, shopAdjustmentDataSchema } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage, clearLocalStorageItem } from '@/lib/hooks/useLocalStorage';

interface DataInputFormProps {
  onSubmit: (operationData: ShopOperationData, adjustmentData: ShopAdjustmentData, promotionData?: PromotionData) => void;
}

// 输入字段组件
const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  isPercentage?: boolean;
  isInteger?: boolean;
  errorKey?: string;
  errors?: Record<string, string>;
}> = ({
  label,
  value,
  onChange,
  isPercentage = false,
  isInteger = false,
  errorKey,
  errors = {}
}) => (
  <div>
    <Label>{label} {isPercentage && '(%)'}</Label>
    <Input
      type="number"
      value={value.toString()}
      onChange={(e) => {
        const inputValue = e.target.value;

        // 允许空输入（用户正在清空输入框）
        if (inputValue === '') {
          onChange(0);
          return;
        }

        // 解析数值
        const parsedValue = parseFloat(inputValue);

        // 检查是否为有效数字
        if (!isNaN(parsedValue)) {
          let finalValue = isInteger ? Math.floor(parsedValue) : parsedValue;

          // 应用边界限制
          finalValue = Math.max(0, finalValue);
          if (isPercentage) {
            finalValue = Math.min(100, finalValue);
          }

          onChange(finalValue);
        }
      }}
      step={isInteger ? 1 : 0.1}
      min={0}
      max={isPercentage ? 100 : undefined}
      className={errorKey && errors[errorKey] ? 'border-red-500' : ''}
    />
    {errorKey && errors[errorKey] && (
      <p className="text-sm text-red-500 mt-1">{errors[errorKey]}</p>
    )}
  </div>
);

export function DataInputForm({ onSubmit }: DataInputFormProps) {
  // 使用localStorage持久化表单数据
  const [operationData, setOperationData] = useLocalStorage<ShopOperationData>('reportForm_operationData', {
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

  // 存储比上周增长的数据
  const [weeklyGrowth, setWeeklyGrowth] = useLocalStorage('reportForm_weeklyGrowth', {
    exposureCount: 0,
    visitCount: 0,
    visitConversionRate: 0,
    orderConversionRate: 0,
    orderCount: 0,
    repurchaseRate: 0
  });

  const [includePromotion, setIncludePromotion] = useLocalStorage<boolean>('reportForm_includePromotion', false);
  const [promotionData, setPromotionData] = useLocalStorage<PromotionData>('reportForm_promotionData', {
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

  // 店铺调整项目数据（必选）
  const [adjustmentData, setAdjustmentData] = useLocalStorage<ShopAdjustmentData>('reportForm_adjustmentData', {
    thisWeekAdjustments: [],
    lastWeekAdjustments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 处理调整项目多选框变化
  const handleAdjustmentChange = (option: ShopAdjustmentOption, period: 'thisWeek' | 'lastWeek', checked: boolean) => {
    setAdjustmentData(prev => {
      const field = period === 'thisWeek' ? 'thisWeekAdjustments' : 'lastWeekAdjustments';
      const currentOptions = prev[field];

      if (checked) {
        // 添加选项（如果不存在）
        if (!currentOptions.includes(option)) {
          return {
            ...prev,
            [field]: [...currentOptions, option]
          };
        }
      } else {
        // 移除选项
        return {
          ...prev,
          [field]: currentOptions.filter(item => item !== option)
        };
      }

      return prev;
    });
  };

  // 自动计算上周数据的函数
  const updateLastWeekData = useCallback(() => {
    setOperationData(prev => ({
      ...prev,
      lastWeek: {
        ...prev.lastWeek,
        exposureCount: Math.max(0, prev.thisWeek.exposureCount - weeklyGrowth.exposureCount),
        visitCount: Math.max(0, prev.thisWeek.visitCount - weeklyGrowth.visitCount),
        visitConversionRate: Math.max(0, prev.thisWeek.visitConversionRate - weeklyGrowth.visitConversionRate),
        orderConversionRate: Math.max(0, prev.thisWeek.orderConversionRate - weeklyGrowth.orderConversionRate),
        orderCount: Math.max(0, prev.thisWeek.orderCount - weeklyGrowth.orderCount)
        // 复购率不参与自动计算，由用户手动输入
      }
    }));
  }, [weeklyGrowth, setOperationData]);

  // 当增长数据变化时自动计算上周数据
  useEffect(() => {
    updateLastWeekData();
  }, [weeklyGrowth, updateLastWeekData]); // 包含所有依赖

  // 辅助函数：更新本周数据并重新计算上周数据
  const updateThisWeekData = useCallback((field: keyof typeof operationData.thisWeek, value: number) => {
    setOperationData(prev => ({
      ...prev,
      thisWeek: { ...prev.thisWeek, [field]: value }
    }));
    // 延迟计算上周数据，确保状态已更新
    setTimeout(updateLastWeekData, 0);
  }, [operationData, setOperationData, updateLastWeekData]);

  // 重置表单数据
  const resetFormData = () => {
    const confirmed = window.confirm('确定要清空所有表单数据吗？此操作不可撤销。');
    if (confirmed) {
      setOperationData({
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
      setWeeklyGrowth({
        exposureCount: 0,
        visitCount: 0,
        visitConversionRate: 0,
        orderConversionRate: 0,
        orderCount: 0,
        repurchaseRate: 0  // 保留字段但不使用
      });
      setIncludePromotion(false);
      setPromotionData({
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
      setErrors({});
    }
  };

  const validateBusinessLogic = (opData: ShopOperationData, promoData?: PromotionData): string[] => {
    const warnings: string[] = [];
    
    // 检查数据合理性
    if (opData.thisWeek.visitCount > opData.thisWeek.exposureCount) {
      warnings.push('本周入店人数不应超过曝光人数');
    }
    if (opData.lastWeek.visitCount > opData.lastWeek.exposureCount) {
      warnings.push('上周入店人数不应超过曝光人数');
    }
    
    if (opData.thisWeek.orderCount > opData.thisWeek.visitCount) {
      warnings.push('本周下单人数不应超过入店人数');
    }
    if (opData.lastWeek.orderCount > opData.lastWeek.visitCount) {
      warnings.push('上周下单人数不应超过入店人数');
    }
    
    // 检查转化率计算是否合理
    const thisWeekCalculatedVisitRate = opData.thisWeek.exposureCount > 0 
      ? (opData.thisWeek.visitCount / opData.thisWeek.exposureCount) * 100 
      : 0;
    const thisWeekInputVisitRate = opData.thisWeek.visitConversionRate;
    
    if (Math.abs(thisWeekCalculatedVisitRate - thisWeekInputVisitRate) > 5) {
      warnings.push(`本周入店转化率可能不准确。根据数据计算应为 ${thisWeekCalculatedVisitRate.toFixed(2)}%`);
    }
    
    const lastWeekCalculatedVisitRate = opData.lastWeek.exposureCount > 0 
      ? (opData.lastWeek.visitCount / opData.lastWeek.exposureCount) * 100 
      : 0;
    const lastWeekInputVisitRate = opData.lastWeek.visitConversionRate;
    
    if (Math.abs(lastWeekCalculatedVisitRate - lastWeekInputVisitRate) > 5) {
      warnings.push(`上周入店转化率可能不准确。根据数据计算应为 ${lastWeekCalculatedVisitRate.toFixed(2)}%`);
    }
    
    // 检查推广数据合理性
    if (promoData) {
      if (promoData.thisWeek.visitCount > promoData.thisWeek.exposureCount) {
        warnings.push('本周推广进店量不应超过推广曝光量');
      }
      if (promoData.lastWeek.visitCount > promoData.lastWeek.exposureCount) {
        warnings.push('上周推广进店量不应超过推广曝光量');
      }
      
      // 检查推广进店率计算
      const thisWeekCalculatedPromoRate = promoData.thisWeek.exposureCount > 0 
        ? (promoData.thisWeek.visitCount / promoData.thisWeek.exposureCount) * 100 
        : 0;
      if (Math.abs(thisWeekCalculatedPromoRate - promoData.thisWeek.visitRate) > 5) {
        warnings.push(`本周推广进店率可能不准确。根据数据计算应为 ${thisWeekCalculatedPromoRate.toFixed(2)}%`);
      }
    }
    
    return warnings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const validatedOperationData = operationDataSchema.parse(operationData);
      let validatedPromotionData: PromotionData | undefined;

      if (includePromotion) {
        validatedPromotionData = promotionDataSchema.parse(promotionData);
      }

      // 店铺调整项目为必选项
      const validatedAdjustmentData = shopAdjustmentDataSchema.parse(adjustmentData);

      // 业务逻辑验证
      const businessWarnings = validateBusinessLogic(validatedOperationData, validatedPromotionData);

      if (businessWarnings.length > 0) {
        const confirmed = window.confirm(
          `检测到以下数据异常，是否继续生成报告？\n\n${businessWarnings.join('\n')}`
        );
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }

      setErrors({});
      await onSubmit(validatedOperationData, validatedAdjustmentData, validatedPromotionData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const key = err.path.join('.');
            newErrors[key] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error('表单提交错误:', error);
        alert('提交失败，请检查输入数据');
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* 运营数据表单 */}
      <Card>
        <CardHeader>
          <CardTitle>店铺运营数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-gray-600">填写本周数据和增长数据，上周数据将自动计算（本周数据 - 增长数据 = 上周数据）</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* 第一列：本周数据 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 text-blue-600">本周数据</h3>
              <div className="space-y-4">
                <div>
                  <Label>曝光人数</Label>
                  <Input
                    type="number"
                    value={operationData.thisWeek.exposureCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        thisWeek: { ...prev.thisWeek, exposureCount: val }
                      }));
                    }}
                    placeholder="曝光人数"
                  />
                </div>
                
                <div>
                  <Label>入店人数</Label>
                  <Input
                    type="number"
                    value={operationData.thisWeek.visitCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        thisWeek: { ...prev.thisWeek, visitCount: val }
                      }));
                    }}
                    placeholder="入店人数"
                  />
                </div>
                
                <div>
                  <Label>入店转化率 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={operationData.thisWeek.visitConversionRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        thisWeek: { ...prev.thisWeek, visitConversionRate: val }
                      }));
                    }}
                    placeholder="入店转化率"
                  />
                </div>
                
                <div>
                  <Label>下单转化率 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={operationData.thisWeek.orderConversionRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        thisWeek: { ...prev.thisWeek, orderConversionRate: val }
                      }));
                    }}
                    placeholder="下单转化率"
                  />
                </div>
                
                <div>
                  <Label>下单人数</Label>
                  <Input
                    type="number"
                    value={operationData.thisWeek.orderCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        thisWeek: { ...prev.thisWeek, orderCount: val }
                      }));
                    }}
                    placeholder="下单人数"
                  />
                </div>
                
                <div>
                  <Label>复购率 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={operationData.thisWeek.repurchaseRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        thisWeek: { ...prev.thisWeek, repurchaseRate: val }
                      }));
                    }}
                    placeholder="复购率"
                  />
                </div>
              </div>
            </div>

            {/* 第二列：比上周增长数据 */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-4 text-green-600">比上周增长数据</h3>
              <div className="space-y-4">
                <div>
                  <Label>曝光人数增长</Label>
                  <Input
                    type="number"
                    value={weeklyGrowth.exposureCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setWeeklyGrowth(prev => ({ ...prev, exposureCount: val }));
                    }}
                    placeholder="增长数"
                  />
                </div>
                
                <div>
                  <Label>入店人数增长</Label>
                  <Input
                    type="number"
                    value={weeklyGrowth.visitCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setWeeklyGrowth(prev => ({ ...prev, visitCount: val }));
                    }}
                    placeholder="增长数"
                  />
                </div>
                
                <div>
                  <Label>入店转化率增长 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={weeklyGrowth.visitConversionRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setWeeklyGrowth(prev => ({ ...prev, visitConversionRate: val }));
                    }}
                    placeholder="增长%"
                  />
                </div>
                
                <div>
                  <Label>下单转化率增长 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={weeklyGrowth.orderConversionRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setWeeklyGrowth(prev => ({ ...prev, orderConversionRate: val }));
                    }}
                    placeholder="增长%"
                  />
                </div>
                
                <div>
                  <Label>下单人数增长</Label>
                  <Input
                    type="number"
                    value={weeklyGrowth.orderCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setWeeklyGrowth(prev => ({ ...prev, orderCount: val }));
                    }}
                    placeholder="增长数"
                  />
                </div>
                
                <div>
                  <Label>复购率增长 (%)（禁用）</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value=""
                    disabled
                    className="bg-gray-100"
                    placeholder="不参与计算"
                  />
                </div>
              </div>
            </div>

            {/* 第三列：上周数据（自动计算） */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-600">上周数据（自动计算）</h3>
              <div className="space-y-4">
                <div>
                  <Label>曝光人数</Label>
                  <Input
                    value={operationData.lastWeek.exposureCount}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div>
                  <Label>入店人数</Label>
                  <Input
                    value={operationData.lastWeek.visitCount}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div>
                  <Label>入店转化率 (%)</Label>
                  <Input
                    value={operationData.lastWeek.visitConversionRate.toFixed(1) + '%'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div>
                  <Label>下单转化率 (%)</Label>
                  <Input
                    value={operationData.lastWeek.orderConversionRate.toFixed(1) + '%'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div>
                  <Label>下单人数</Label>
                  <Input
                    value={operationData.lastWeek.orderCount}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                
                <div>
                  <Label>复购率 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={operationData.lastWeek.repurchaseRate || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setOperationData(prev => ({
                        ...prev,
                        lastWeek: { ...prev.lastWeek, repurchaseRate: val }
                      }));
                    }}
                    placeholder="手动输入复购率"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 店铺调整项目（必选） */}
      <Card>
        <CardHeader>
          <CardTitle>店铺调整项目</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 本周调整项目 */}
              <div>
                <h4 className="text-lg font-medium mb-4">本周店铺调整项目</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {Object.values(ShopAdjustmentOption).map((option) => (
                    <div key={`thisWeek-${option}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`thisWeek-${option}`}
                        checked={adjustmentData.thisWeekAdjustments.includes(option)}
                        onCheckedChange={(checked) =>
                          handleAdjustmentChange(option, 'thisWeek', checked === true)
                        }
                      />
                      <Label
                        htmlFor={`thisWeek-${option}`}
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 上周调整项目 */}
              <div>
                <h4 className="text-lg font-medium mb-4">上周店铺调整项目</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {Object.values(ShopAdjustmentOption).map((option) => (
                    <div key={`lastWeek-${option}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lastWeek-${option}`}
                        checked={adjustmentData.lastWeekAdjustments.includes(option)}
                        onCheckedChange={(checked) =>
                          handleAdjustmentChange(option, 'lastWeek', checked === true)
                        }
                      />
                      <Label
                        htmlFor={`lastWeek-${option}`}
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
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
              onCheckedChange={(checked) => setIncludePromotion(checked === true)}
            />
            <span>点金推广数据（可选）</span>
          </CardTitle>
        </CardHeader>
        {includePromotion && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 本周推广数据 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">本周推广数据</h3>
                <div className="space-y-4">
                  <div>
                    <Label>推广花费 (¥)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionData.thisWeek.cost === 0 ? '' : promotionData.thisWeek.cost.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setPromotionData(prev => ({
                            ...prev,
                            thisWeek: { ...prev.thisWeek, cost: 0 }
                          }));
                          return;
                        }
                        const val = parseFloat(inputValue);
                        if (!isNaN(val) && val >= 0) {
                          setPromotionData(prev => ({
                            ...prev,
                            thisWeek: { ...prev.thisWeek, cost: val }
                          }));
                        }
                      }}
                      placeholder="推广花费"
                    />
                  </div>
                  
                  <div>
                    <Label>推广曝光量</Label>
                    <Input
                      type="number"
                      value={promotionData.thisWeek.exposureCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPromotionData(prev => ({
                          ...prev,
                          thisWeek: { ...prev.thisWeek, exposureCount: val }
                        }));
                      }}
                      placeholder="推广曝光量"
                    />
                  </div>
                  
                  <div>
                    <Label>推广进店量</Label>
                    <Input
                      type="number"
                      value={promotionData.thisWeek.visitCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPromotionData(prev => ({
                          ...prev,
                          thisWeek: { ...prev.thisWeek, visitCount: val }
                        }));
                      }}
                      placeholder="推广进店量"
                    />
                  </div>
                  
                  <div>
                    <Label>进店率 (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionData.thisWeek.visitRate === 0 ? '' : promotionData.thisWeek.visitRate.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setPromotionData(prev => ({
                            ...prev,
                            thisWeek: { ...prev.thisWeek, visitRate: 0 }
                          }));
                          return;
                        }
                        const val = parseFloat(inputValue);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          setPromotionData(prev => ({
                            ...prev,
                            thisWeek: { ...prev.thisWeek, visitRate: val }
                          }));
                        }
                      }}
                      placeholder="进店率"
                    />
                  </div>
                  
                  <div>
                    <Label>单次进店成本 (¥)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionData.thisWeek.costPerVisit === 0 ? '' : promotionData.thisWeek.costPerVisit.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setPromotionData(prev => ({
                            ...prev,
                            thisWeek: { ...prev.thisWeek, costPerVisit: 0 }
                          }));
                          return;
                        }
                        const val = parseFloat(inputValue);
                        if (!isNaN(val) && val >= 0) {
                          setPromotionData(prev => ({
                            ...prev,
                            thisWeek: { ...prev.thisWeek, costPerVisit: val }
                          }));
                        }
                      }}
                      placeholder="单次进店成本"
                    />
                  </div>
                </div>
              </div>

              {/* 上周推广数据 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">上周推广数据</h3>
                <div className="space-y-4">
                  <div>
                    <Label>推广花费 (¥)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionData.lastWeek.cost === 0 ? '' : promotionData.lastWeek.cost.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setPromotionData(prev => ({
                            ...prev,
                            lastWeek: { ...prev.lastWeek, cost: 0 }
                          }));
                          return;
                        }
                        const val = parseFloat(inputValue);
                        if (!isNaN(val) && val >= 0) {
                          setPromotionData(prev => ({
                            ...prev,
                            lastWeek: { ...prev.lastWeek, cost: val }
                          }));
                        }
                      }}
                      placeholder="推广花费"
                    />
                  </div>
                  
                  <div>
                    <Label>推广曝光量</Label>
                    <Input
                      type="number"
                      value={promotionData.lastWeek.exposureCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPromotionData(prev => ({
                          ...prev,
                          lastWeek: { ...prev.lastWeek, exposureCount: val }
                        }));
                      }}
                      placeholder="推广曝光量"
                    />
                  </div>
                  
                  <div>
                    <Label>推广进店量</Label>
                    <Input
                      type="number"
                      value={promotionData.lastWeek.visitCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPromotionData(prev => ({
                          ...prev,
                          lastWeek: { ...prev.lastWeek, visitCount: val }
                        }));
                      }}
                      placeholder="推广进店量"
                    />
                  </div>
                  
                  <div>
                    <Label>进店率 (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionData.lastWeek.visitRate === 0 ? '' : promotionData.lastWeek.visitRate.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setPromotionData(prev => ({
                            ...prev,
                            lastWeek: { ...prev.lastWeek, visitRate: 0 }
                          }));
                          return;
                        }
                        const val = parseFloat(inputValue);
                        if (!isNaN(val) && val >= 0 && val <= 100) {
                          setPromotionData(prev => ({
                            ...prev,
                            lastWeek: { ...prev.lastWeek, visitRate: val }
                          }));
                        }
                      }}
                      placeholder="进店率"
                    />
                  </div>
                  
                  <div>
                    <Label>单次进店成本 (¥)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionData.lastWeek.costPerVisit === 0 ? '' : promotionData.lastWeek.costPerVisit.toString()}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setPromotionData(prev => ({
                            ...prev,
                            lastWeek: { ...prev.lastWeek, costPerVisit: 0 }
                          }));
                          return;
                        }
                        const val = parseFloat(inputValue);
                        if (!isNaN(val) && val >= 0) {
                          setPromotionData(prev => ({
                            ...prev,
                            lastWeek: { ...prev.lastWeek, costPerVisit: val }
                          }));
                        }
                      }}
                      placeholder="单次进店成本"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex gap-4">
        <Button 
          onClick={resetFormData}
          variant="outline" 
          className="flex-1" 
          size="lg"
          disabled={isSubmitting}
        >
          清空数据
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? '正在生成报告...' : '生成周报'}
        </Button>
      </div>
      
      {/* 数据持久化提示 */}
      <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="font-medium text-blue-800">数据自动保存：</p>
        <p className="text-blue-700">
          您的表单数据会自动保存到浏览器本地，刷新页面后数据不会丢失。如需清空请点击"清空数据"按钮。
        </p>
      </div>
    </div>
  );
}