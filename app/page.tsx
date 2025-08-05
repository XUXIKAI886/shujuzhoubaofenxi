'use client';

import { useState } from 'react';
import { ShopBasicInfo, ShopOperationData, PromotionData, ReportData } from '@/lib/types';
import { ShopInfoForm } from '@/components/ShopInfoForm';
import { DataInputForm } from '@/components/DataInputForm';
import { ReportDisplay } from '@/components/ReportDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';

type Step = 'shop-info' | 'data-input' | 'generating' | 'report';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<Step>('shop-info');
  const [shopInfo, setShopInfo] = useState<ShopBasicInfo | null>(null);
  const [operationData, setOperationData] = useState<ShopOperationData | null>(null);
  const [promotionData, setPromotionData] = useState<PromotionData | undefined>(undefined);
  const [reportHtml, setReportHtml] = useState('');
  const [error, setError] = useState('');

  const handleShopInfoSubmit = (data: ShopBasicInfo) => {
    setShopInfo(data);
    setCurrentStep('data-input');
  };

  const handleDataSubmit = async (operation: ShopOperationData, promotion?: PromotionData) => {
    setOperationData(operation);
    setPromotionData(promotion);
    
    // 直接开始生成报告，无需API配置步骤
    setCurrentStep('generating');
    setError('');

    const reportData: ReportData = {
      shopInfo: shopInfo!,
      operationData: operation,
      promotionData: promotion,
      generatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportData
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setReportHtml(result.data);
        setCurrentStep('report');
      } else {
        setError(result.error || '生成报告失败');
        setCurrentStep('data-input');
      }
    } catch (error) {
      setError('网络请求失败，请检查网络连接');
      setCurrentStep('data-input');
    }
  };


  const renderStep = () => {
    switch (currentStep) {
      case 'shop-info':
        return <ShopInfoForm onSubmit={handleShopInfoSubmit} />;
      
      case 'data-input':
        return (
          <div className="space-y-4">
            <DataInputForm onSubmit={handleDataSubmit} />
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('shop-info')}
              >
                上一步
              </Button>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
        );
      
      case 'generating':
        return (
          <div className="space-y-4">
            <LoadingSpinner message="正在生成报告，请稍候..." />
            <div className="flex justify-start">
              <Button 
                variant="outline" 
                disabled
                className="opacity-50"
              >
                上一步（生成中...）
              </Button>
            </div>
          </div>
        );
      
      case 'report':
        return (
          <div className="space-y-4">
            <ReportDisplay 
              htmlContent={reportHtml}
              onBackToForm={() => {
                setCurrentStep('shop-info');
                setReportHtml('');
                setError('');
              }}
            />
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('data-input')}
              >
                上一步
              </Button>
              <Button 
                onClick={() => {
                  setCurrentStep('shop-info');
                  setReportHtml('');
                  setError('');
                  setShopInfo(null);
                  setOperationData(null);
                  setPromotionData(undefined);
                }}
                className="flex-1"
              >
                重新开始
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepIndex = (step: Step): number => {
    const steps: Step[] = ['shop-info', 'data-input', 'report'];
    return steps.indexOf(step);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className={`mx-auto px-4 ${currentStep === 'report' ? 'max-w-7xl' : 'max-w-4xl'}`}>
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
              { key: 'report', label: '生成报告' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.key 
                    ? 'bg-blue-600 text-white' 
                    : getStepIndex(currentStep) > index
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
                {index < 2 && (
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