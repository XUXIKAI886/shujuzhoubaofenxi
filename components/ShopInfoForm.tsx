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
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-center text-2xl text-blue-800">店铺基本信息</CardTitle>
          <p className="text-center text-gray-600 mt-2">请填写您的店铺基本信息，所有字段均为必填项</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-base font-medium">店铺名称 *</Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  placeholder="请输入店铺名称"
                  className={`h-12 ${errors.shopName ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.shopName && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.shopName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-medium">经营品类 *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="如：中式快餐、奶茶饮品等"
                  className={`h-12 ${errors.category ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <span className="mr-1">⚠</span>
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-medium">店铺地址 *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="请输入详细地址"
                className={`h-12 ${errors.address ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.address}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessHours" className="text-base font-medium">营业时间 *</Label>
              <Input
                id="businessHours"
                value={formData.businessHours}
                onChange={(e) => handleInputChange('businessHours', e.target.value)}
                placeholder="如：06:30 - 15:30"
                className={`h-12 ${errors.businessHours ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
              />
              {errors.businessHours && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  {errors.businessHours}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                格式示例：06:30 - 15:30（请使用24小时制）
              </p>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                下一步：填写运营数据 →
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}