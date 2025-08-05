'use client';

import { useState } from 'react';
import { z } from 'zod';
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
    <div className="max-w-4xl mx-auto">
      <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-2xl shadow-blue-500/10">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏪</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold">店铺基本信息</CardTitle>
          <p className="text-center text-blue-100 mt-2">请完善您的店铺信息以开始数据分析</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="shopName" className="text-base font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  店铺名称
                </Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  placeholder="请输入店铺名称"
                  className={`h-14 text-lg border-2 rounded-xl transition-all duration-200 ${errors.shopName ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-blue-50'}`}
                />
                {errors.shopName && (
                  <p className="text-sm text-red-500 mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <span className="mr-2">⚠️</span>
                    {errors.shopName}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  经营品类
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="如：中式快餐、奶茶饮品等"
                  className={`h-14 text-lg border-2 rounded-xl transition-all duration-200 ${errors.category ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-blue-50'}`}
                />
                {errors.category && (
                  <p className="text-sm text-red-500 mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <span className="mr-2">⚠️</span>
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="address" className="text-base font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                店铺地址
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="请输入详细地址"
                className={`h-14 text-lg border-2 rounded-xl transition-all duration-200 ${errors.address ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-blue-50'}`}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                  <span className="mr-2">⚠️</span>
                  {errors.address}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="businessHours" className="text-base font-semibold text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                营业时间
              </Label>
              <Input
                id="businessHours"
                value={formData.businessHours}
                onChange={(e) => handleInputChange('businessHours', e.target.value)}
                placeholder="如：06:30 - 15:30"
                className={`h-14 text-lg border-2 rounded-xl transition-all duration-200 ${errors.businessHours ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-blue-50'}`}
              />
              {errors.businessHours && (
                <p className="text-sm text-red-500 mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                  <span className="mr-2">⚠️</span>
                  {errors.businessHours}
                </p>
              )}
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border-l-4 border-orange-400">
                <span className="font-medium">格式示例：</span>06:30 - 15:30（请使用24小时制）
              </p>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl rounded-xl"
              >
                <span className="mr-3">下一步：数据录入</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}