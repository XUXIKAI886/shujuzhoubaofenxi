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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className={`mx-auto px-4 py-8 ${currentStep === 'report' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        {/* 顶部标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            数据周报生成器
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI驱动的智能数据分析，一键生成专业运营报告
          </p>
        </div>

        {/* 进度指示器 */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {[
                { key: 'shop-info', label: '店铺信息', icon: '🏪' },
                { key: 'data-input', label: '数据录入', icon: '📊' },
                { key: 'report', label: '生成报告', icon: '📋' }
              ].map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                      currentStep === step.key 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                        : getStepIndex(currentStep) > index
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                        : 'bg-white text-gray-400 shadow-sm border border-gray-200'
                    }`}>
                      {getStepIndex(currentStep) > index ? '✓' : step.icon}
                      {currentStep === step.key && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25"></div>
                      )}
                    </div>
                    <span className={`mt-3 text-sm font-medium transition-colors ${
                      currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 mx-4 transition-colors ${
                      getStepIndex(currentStep) > index ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="relative">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}