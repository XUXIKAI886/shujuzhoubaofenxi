'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 简化的文本转HTML函数
function convertTextToHTML(text: string): string {
  console.log('开始转换纯文本为HTML格式');

  // 基础的文本转HTML逻辑
  let htmlContent = text
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.trim() === '') return '';

      // 检查是否是标题
      if (paragraph.includes('报告') || paragraph.includes('数据总览') || paragraph.includes('分析')) {
        return `<h2 style="color: #2c3e50; margin: 25px 0 15px 0; font-size: 20px;">${paragraph.trim()}</h2>`;
      }

      // 普通段落
      return `<p style="margin: 15px 0; line-height: 1.6;">${paragraph.trim()}</p>`;
    })
    .join('');

  // 添加基础样式和容器
  return `
    <style>
      .report-container {
        font-family: 'Arial', 'Microsoft YaHei', sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 30px;
        background: #f8f9fa;
      }
      .trend-up { color: #27ae60; font-weight: bold; }
      .trend-down { color: #e74c3c; font-weight: bold; }
    </style>
    <div class="report-container">
      ${htmlContent}
    </div>
  `;
}

interface ReportDisplayProps {
  htmlContent: string;
}

export function ReportDisplay({ htmlContent }: ReportDisplayProps) {
  const [processedHtml, setProcessedHtml] = useState<string>('');

  useEffect(() => {
    // 清理markdown代码块标记
    let processedContent = htmlContent;
    
    // 移除开头的markdown代码块标记
    processedContent = processedContent.replace(/^```html\s*/i, '');
    processedContent = processedContent.replace(/^```\s*/i, '');
    
    // 移除结尾的markdown代码块标记
    processedContent = processedContent.replace(/\s*```\s*$/i, '');
    
    // 移除其他可能的markdown标记
    processedContent = processedContent.trim();
    
    // 调试：打印处理后的内容
    console.log('原始HTML内容:', htmlContent.substring(0, 500));
    console.log('处理后内容:', processedContent.substring(0, 500));
    
    // 检查是否包含HTML标签
    const hasHtmlTags = /<[^>]+>/.test(processedContent);
    console.log('包含HTML标签:', hasHtmlTags);
    
    // 关键修复：处理完整的HTML文档
    if (hasHtmlTags && processedContent.includes('<!DOCTYPE html>')) {
      console.log('检测到完整HTML文档，正在提取body和style内容...');
      
      // 提取head中的CSS样式
      const styleMatch = processedContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      let extractedStyles = '';
      if (styleMatch) {
        extractedStyles = styleMatch.join('\n');
        console.log('提取到CSS样式:', extractedStyles.substring(0, 200));
      }
      
      // 提取body内容或main容器内容
      let bodyContent = '';
      const bodyMatch = processedContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
      } else {
        // 如果没有body标签，查找主要容器
        const containerMatch = processedContent.match(/<div[^>]*class[^>]*report-container[^>]*>([\s\S]*?)(?=<\/html>|$)/i);
        if (containerMatch) {
          bodyContent = `<div class="report-container">${containerMatch[1]}</div>`;
        } else {
          // 去掉html、head标签，保留其余内容
          bodyContent = processedContent
            .replace(/<!DOCTYPE[^>]*>/i, '')
            .replace(/<html[^>]*>/i, '')
            .replace(/<\/html>/i, '')
            .replace(/<head[^>]*>[\s\S]*?<\/head>/i, '')
            .replace(/<body[^>]*>/i, '')
            .replace(/<\/body>/i, '')
            .trim();
        }
      }
      
      // 合并样式和内容
      processedContent = extractedStyles + '\n' + bodyContent;
      console.log('合并后内容预览:', processedContent.substring(0, 300));
    }
    
    if (!hasHtmlTags) {
      // 如果没有HTML标签，使用简化的文本转HTML函数
      console.log('AI返回的是纯文本，正在转换为HTML格式...');
      processedContent = convertTextToHTML(processedContent);
    } else {
      console.log('AI返回的是HTML格式，直接使用');
    }
    
    // 完全移除DOMPurify限制，直接使用原生HTML内容
    console.log('最终处理内容:', processedContent.substring(0, 500));
    console.log('HTML标签检测:', hasHtmlTags ? '包含HTML' : '纯文本');
    setProcessedHtml(processedContent);
  }, [htmlContent]);



  return (
    <>

      {/* 报告内容 - 直接显示，无额外包装 */}
      <div
        className="w-full max-w-none"
        style={{
          width: '100%',
          maxWidth: 'none',
          minWidth: '900px'
        }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {/* 提示信息 */}
      <div
        className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4"
        style={{
          width: '100%',
          maxWidth: 'none',
          minWidth: '900px'
        }}
      >
        <p className="font-medium text-blue-800">提示信息：</p>
        <p className="text-blue-700">
          此报告内容由呈尚策划运营部生成，完整保留所有样式和格式。请仔细核查数据准确性。
        </p>
      </div>
    </>
  );
}