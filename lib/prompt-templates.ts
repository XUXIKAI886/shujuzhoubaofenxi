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
**重要输出要求：直接返回HTML代码片段，使用麦肯锡咨询风格设计，不要使用markdown格式**

请为以下店铺生成运营分析报告：

## 店铺信息
- 店铺名称：${shopInfo.shopName}
- 经营品类：${shopInfo.category}
- 店铺地址：${shopInfo.address}
- 营业时间：${shopInfo.businessHours}

## 运营数据对比
### 本周数据
- 曝光人数：${operationData.thisWeek.exposureCount}人（${exposureChange}）
- 入店人数：${operationData.thisWeek.visitCount}人（${visitChange}）
- 入店转化率：${operationData.thisWeek.visitConversionRate}%
- 下单转化率：${operationData.thisWeek.orderConversionRate}%
- 下单人数：${operationData.thisWeek.orderCount}人（${orderChange}）
- 复购率：${operationData.thisWeek.repurchaseRate}%

### 上周数据
- 曝光人数：${operationData.lastWeek.exposureCount}人
- 入店人数：${operationData.lastWeek.visitCount}人
- 入店转化率：${operationData.lastWeek.visitConversionRate}%
- 下单转化率：${operationData.lastWeek.orderConversionRate}%
- 下单人数：${operationData.lastWeek.orderCount}人
- 复购率：${operationData.lastWeek.repurchaseRate}%

${promotionSection}

**表格格式要求**：数据表格必须严格按照以下5列结构：

| 指标 | 本周数据 | 上周数据 | 变化趋势 | 变化百分比 |
|------|----------|----------|----------|------------|
| 曝光人数 | ${operationData.thisWeek.exposureCount} | ${operationData.lastWeek.exposureCount} | 上升/下降 | ${exposureChange} |
| 入店人数 | ${operationData.thisWeek.visitCount} | ${operationData.lastWeek.visitCount} | 上升/下降 | ${visitChange} |
| 入店转化率 | ${operationData.thisWeek.visitConversionRate}% | ${operationData.lastWeek.visitConversionRate}% | 上升/下降 | 计算变化 |
| 下单转化率 | ${operationData.thisWeek.orderConversionRate}% | ${operationData.lastWeek.orderConversionRate}% | 上升/下降 | 计算变化 |
| 下单人数 | ${operationData.thisWeek.orderCount} | ${operationData.lastWeek.orderCount} | 上升/下降 | ${orderChange} |
| 复购率 | ${operationData.thisWeek.repurchaseRate}% | ${operationData.lastWeek.repurchaseRate}% | 上升/下降 | 计算变化 |
${promotionData ? `| 推广花费 | ¥${promotionData.thisWeek.cost} | ¥${promotionData.lastWeek.cost} | 上升/下降 | 计算变化 |
| 推广曝光量 | ${promotionData.thisWeek.exposureCount} | ${promotionData.lastWeek.exposureCount} | 上升/下降 | 计算变化 |
| 推广进店量 | ${promotionData.thisWeek.visitCount} | ${promotionData.lastWeek.visitCount} | 上升/下降 | 计算变化 |
| 推广进店率 | ${promotionData.thisWeek.visitRate}% | ${promotionData.lastWeek.visitRate}% | 上升/下降 | 计算变化 |
| 单次进店成本 | ¥${promotionData.thisWeek.costPerVisit} | ¥${promotionData.lastWeek.costPerVisit} | 上升/下降 | 计算变化 |` : ''}

**输出格式**：请直接返回完整的HTML代码片段，包含以下结构：

1. 完整CSS样式（使用#0073e6蓝色主题，专业麦肯锡风格）
2. 报告标题和店铺信息
3. **严格按照5列格式的数据表格**（指标|本周数据|上周数据|变化趋势|变化百分比）
4. 深度分析（每个指标详细解读，确保内容完整）
5. 改进建议（具体可执行的措施）

**关键要求**：
- **表格必须5列对齐**：每个数据单独占一列，不要混合显示
- **变化百分比单独一列**：不要与本周数据混在一起
- 使用麦肯锡咨询报告专业风格
- 蓝色主题色#0073e6
- 使用Font Awesome图标，禁用emoji
- 确保分析内容完整，不出现截断
- 直接返回HTML，不使用markdown格式

现在生成报告：
  `;
}