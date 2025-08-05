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
            {/* 操作按钮移到报告上方 */}
            <div className="flex flex-wrap gap-2 justify-between mb-4">
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
              >
                重新生成
              </Button>
            </div>

            <ReportDisplay
              htmlContent={reportHtml}
            />
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
    <div className="min-h-screen bg-gray-50">
      {/* 专业页头设计 */}
      <header className="header-gradient shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            {/* 左侧：系统标题和图标 */}
            <div className="flex items-center space-x-4">
              <div className="icon-container rounded-lg p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm flex items-center gap-3 flex-wrap">
                  <span>美团外卖数据统计周报系统</span>
                  <span className="upgrade-badge text-white text-sm font-bold px-3 py-1 rounded-full border-2 border-yellow-300 relative z-10">
                    升级版
                  </span>
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  智能数据分析 · 专业报告生成 · AI驱动洞察
                </p>
              </div>
            </div>

            {/* 右侧：部门标识 */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="department-badge rounded-full px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full status-indicator"></div>
                  <span className="text-white font-medium text-sm">呈尚策划运营部专用</span>
                </div>
              </div>
              <div className="icon-container rounded-lg p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* 移动端部门标识 */}
          <div className="md:hidden mt-4 flex justify-center">
            <div className="department-badge rounded-full px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full status-indicator"></div>
                <span className="text-white font-medium text-sm">呈尚策划运营部专用</span>
              </div>
            </div>
          </div>
        </div>

        {/* 装饰性底部边框 */}
        <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 shadow-inner"></div>
      </header>

      <div className={`mx-auto px-4 py-8 ${currentStep === 'report' ? 'max-w-7xl' : 'max-w-4xl'}`}>
        <div className="text-center mb-8">
          <p className="text-gray-600 text-lg">
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