import { ReportData } from './types';

export function buildReportPrompt(data: ReportData): string {
  const { shopInfo, operationData, promotionData } = data;
  
  // 计算数据变化
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return parseFloat(change) > 0 ? `+${change}%` : `${change}%`;
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
**重要输出格式要求：你必须严格返回HTML代码片段，不要使用markdown格式或代码块标记**

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

**输出要求：直接返回HTML代码片段，格式如下（不要包含\`\`\`html或任何markdown标记）：**

请生成一份完整的HTML格式周报，要求：

1. **报告结构**：
   - 标题和店铺基本信息
   - 核心数据总览（使用表格${promotionData ? '，必须包含点金推广相关指标' : ''}）
   - 数据趋势分析（包含变化百分比）
   - 关键指标分析
   - 问题诊断和改进建议
   - 下周行动计划

${promotionData ? `
**核心数据总览表格必须包含以下推广指标行**：
- 推广花费：本周¥${promotionData.thisWeek.cost}，上周¥${promotionData.lastWeek.cost}
- 推广曝光量：本周${promotionData.thisWeek.exposureCount}，上周${promotionData.lastWeek.exposureCount}
- 推广进店量：本周${promotionData.thisWeek.visitCount}，上周${promotionData.lastWeek.visitCount}
- 推广进店率：本周${promotionData.thisWeek.visitRate}%，上周${promotionData.lastWeek.visitRate}%
- 单次进店成本：本周¥${promotionData.thisWeek.costPerVisit}，上周¥${promotionData.lastWeek.costPerVisit}
` : ''}

2. **数据可视化**：
   - 使用HTML表格展示核心数据对比
   - 用颜色区分增长（绿色）和下降（红色）趋势
   - 突出显示关键指标和重要变化
   - ${promotionData ? '**重要**：核心数据总览表格必须包含点金推广数据（推广花费、推广曝光量、推广进店量、进店率、单次进店成本），这些指标必须作为独立行添加到表格中' : ''}
   - ${promotionData ? '表格结构：指标列 | 本周数据列 | 上周数据列 | 变化趋势列 | 变化百分比列，推广数据行必须位于基础运营数据行之后' : ''}

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

**严格输出格式要求**：
你必须直接返回HTML代码片段，不要使用任何markdown格式或代码块标记。

输出内容必须包含：
1. **完整的CSS样式**（在<style>标签中）
2. **详细的分析内容**，每个部分至少3-5段文字分析
3. **专业的表格样式**，使用现代化的UI设计
4. **丰富的内容结构**：
   - 店铺基本信息展示区域
   - 核心数据总览表格（包含推广数据）
   - 详细的数据趋势分析（每个指标至少2-3行分析）
   - 深度的关键指标分析（转化率、复购率、推广效果等）
   - 具体的问题诊断和改进建议（至少5-8条建议）
   - 详细的下周行动计划（具体可执行的措施）

**样式要求**：
- 使用现代化的卡片式布局
- 表格必须有边框、背景色、悬浮效果
- 增长数据用绿色显示，下降数据用红色显示
- 使用阴影和圆角美化外观
- 响应式设计，适配不同屏幕尺寸

**参考样式模板**：
\`\`\`html
<style>
.report-container { max-width: 1200px; margin: 0 auto; padding: 30px; font-family: 'Arial', 'Microsoft YaHei', sans-serif; background: #f8f9fa; }
.report-title { text-align: center; color: #2c3e50; margin-bottom: 30px; font-size: 28px; font-weight: bold; }
.info-card { background: white; border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.data-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
.data-table th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: center; }
.data-table td { padding: 12px 15px; border-bottom: 1px solid #eee; text-align: center; }
.trend-up { color: #27ae60; font-weight: bold; }
.trend-down { color: #e74c3c; font-weight: bold; }
.analysis-section { margin: 25px 0; line-height: 1.8; }
.analysis-section h3 { color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; }
</style>
\`\`\`

**内容深度要求**：
- 数据趋势分析：每个核心指标至少2-3句专业分析，解释变化原因和影响
- 问题诊断：基于数据识别具体问题和机会点，提供根因分析
- 改进建议：提供至少8-10条具体可执行的建议，包含优先级和预期效果
- 行动计划：包含时间安排和执行步骤的详细计划，分为短期(1周)、中期(1月)、长期(3月)

**必须包含的分析维度**：
1. **运营效率分析**：转化漏斗分析，用户行为路径优化
2. **市场竞争分析**：行业对标，竞争优势识别
3. **用户体验分析**：基于转化率数据的用户体验问题诊断
4. **推广效果分析**：ROI计算，推广渠道优化建议
5. **复购策略分析**：客户留存和复购率提升方案
6. **成本控制分析**：单客获取成本优化建议

**报告结构必须包含**：
- 执行摘要（关键发现和建议概述）
- 详细数据分析（每个指标的深度解读）
- 问题识别与机会分析
- 具体改进方案（操作性强的建议）
- 风险评估与应对策略
- 下周具体行动清单

**最终输出格式（重要）**：
直接返回以下格式的HTML代码片段，不要包含任何markdown标记：
<style>
.report-container { 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 30px; 
    font-family: 'Microsoft YaHei', 'Arial', sans-serif; 
    background: #f8f9fa; 
    color: #333;
    border-radius: 15px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.report-title { 
    text-align: center; 
    color: #2c3e50; 
    margin-bottom: 30px; 
    font-size: 28px; 
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.info-card { 
    background: white; 
    border-radius: 12px; 
    padding: 25px; 
    margin: 20px 0; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border: 1px solid #e3e8ee;
}
.info-card h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 20px;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}
.data-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 20px 0; 
    background: white; 
    border-radius: 8px; 
    overflow: hidden; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.data-table th { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    padding: 15px; 
    text-align: center; 
    font-weight: bold;
    font-size: 14px;
}
.data-table td { 
    padding: 12px 15px; 
    text-align: center; 
    border-bottom: 1px solid #eee;
    font-size: 14px;
}
.data-table tr:hover {
    background-color: #f8f9fa;
}
.trend-up { 
    color: #27ae60; 
    font-weight: bold;
    background: rgba(39, 174, 96, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
}
.trend-down { 
    color: #e74c3c; 
    font-weight: bold;
    background: rgba(231, 76, 60, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
}
.analysis-section { 
    margin: 25px 0; 
    line-height: 1.8; 
}
.analysis-section h3 { 
    color: #2c3e50; 
    border-left: 4px solid #3498db; 
    padding-left: 15px; 
    margin: 20px 0 15px 0;
    font-size: 18px;
}
.analysis-section p {
    margin: 12px 0;
    color: #555;
}
.highlight-box {
    background: linear-gradient(135deg, #667eea20, #764ba220);
    border-left: 4px solid #667eea;
    padding: 15px;
    margin: 15px 0;
    border-radius: 0 8px 8px 0;
}
</style>

<div class="report-container">
  <h1 class="report-title">${shopInfo.shopName} - 周度运营数据分析报告</h1>
  
  <div class="info-card">
    <h2>店铺基本信息</h2>
    <p><strong>店铺名称：</strong>${shopInfo.shopName}</p>
    <p><strong>经营品类：</strong>${shopInfo.category}</p>
    <p><strong>店铺地址：</strong>${shopInfo.address}</p>
    <p><strong>营业时间：</strong>${shopInfo.businessHours}</p>
  </div>
  
  <div class="info-card">
    <h2>核心数据总览</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>指标</th>
          <th>本周数据</th>
          <th>上周数据</th>
          <th>变化趋势</th>
          <th>变化百分比</th>
        </tr>
      </thead>
      <tbody>
        <!-- 在这里填入所有数据行，包括推广数据 -->
      </tbody>
    </table>
  </div>
  
  <div class="info-card">
    <div class="analysis-section">
      <h3>数据趋势分析</h3>
      <!-- 详细分析内容 -->
    </div>
  </div>
</div>

**重要提醒**：
- 直接输出HTML代码，不要使用\`\`\`html标记
- 不要返回完整的HTML文档（不要包含DOCTYPE、html、head、body标签）
- 只返回上述格式的HTML代码片段
- 确保CSS样式完整且位于内容前面
- 不要使用markdown格式或代码块标记

现在请生成报告：
  `;
}