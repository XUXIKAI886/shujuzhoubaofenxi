import { ReportData } from './types';

export function buildReportPrompt(data: ReportData): string {
  const { shopInfo, operationData, promotionData, adjustmentData } = data;
  
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

  let adjustmentSection = '';
  if (adjustmentData) {
    const thisWeekItems = adjustmentData.thisWeekAdjustments.length > 0
      ? adjustmentData.thisWeekAdjustments.map(item => `- ${item}`).join('\n')
      : '- 无调整项目';

    const lastWeekItems = adjustmentData.lastWeekAdjustments.length > 0
      ? adjustmentData.lastWeekAdjustments.map(item => `- ${item}`).join('\n')
      : '- 无调整项目';

    adjustmentSection = `
### 店铺调整项目分析
#### 本周调整项目（${adjustmentData.thisWeekAdjustments.length}项）
${thisWeekItems}

#### 上周调整项目（${adjustmentData.lastWeekAdjustments.length}项）
${lastWeekItems}
    `;
  }

  return `
**【重要】直接返回完整的HTML代码，使用现代化企业级报告设计风格**

请为以下店铺生成专业的运营分析报告：

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

${adjustmentSection}

**数据表格要求**：必须生成专业的HTML表格，包含以下数据：

核心运营指标：
- 曝光人数：本周${operationData.thisWeek.exposureCount}，上周${operationData.lastWeek.exposureCount}，变化${exposureChange}
- 入店人数：本周${operationData.thisWeek.visitCount}，上周${operationData.lastWeek.visitCount}，变化${visitChange}
- 入店转化率：本周${operationData.thisWeek.visitConversionRate}%，上周${operationData.lastWeek.visitConversionRate}%
- 下单转化率：本周${operationData.thisWeek.orderConversionRate}%，上周${operationData.lastWeek.orderConversionRate}%
- 下单人数：本周${operationData.thisWeek.orderCount}，上周${operationData.lastWeek.orderCount}，变化${orderChange}
- 复购率：本周${operationData.thisWeek.repurchaseRate}%，上周${operationData.lastWeek.repurchaseRate}%
${promotionData ? `
推广数据：
- 推广花费：本周¥${promotionData.thisWeek.cost}，上周¥${promotionData.lastWeek.cost}
- 推广曝光量：本周${promotionData.thisWeek.exposureCount}，上周${promotionData.lastWeek.exposureCount}
- 推广进店量：本周${promotionData.thisWeek.visitCount}，上周${promotionData.lastWeek.visitCount}
- 推广进店率：本周${promotionData.thisWeek.visitRate}%，上周${promotionData.lastWeek.visitRate}%
- 单次进店成本：本周¥${promotionData.thisWeek.costPerVisit}，上周¥${promotionData.lastWeek.costPerVisit}` : ''}

**【核心要求】直接返回完整的HTML代码，必须包含以下所有元素：**

## 1. 完整的CSS样式设计
- 使用现代化企业级设计风格，主色调：#2563eb（蓝色）
- 表格样式：白色背景，边框线条，斑马纹行
- 卡片式布局，圆角阴影效果
- 响应式设计，适配不同屏幕
- 专业的字体排版（微软雅黑、苹方等）

## 2. 报告结构
- 标题：运营分析报告（居中，大字体）
- 店铺信息卡片：蓝色背景，白色文字，左侧边框装饰
- 数据表格：专业样式，清晰的列对齐
- 深度分析：分段落，每个指标详细解读
- 改进建议：编号列表，具体可执行

## 3. 表格设计要求
- 表头：蓝色背景(#2563eb)，白色文字，居中对齐
- 数据行：交替白色和浅灰色背景
- 变化趋势：上升用红色(#ef4444)显示"上升"，下降用绿色(#22c55e)显示"下降"
- 变化百分比：正数红色，负数绿色，加粗显示
- 列宽均匀分布，文字居中对齐

## 4. 内容分析要求
- 每个指标必须有详细的业务解读
- 分析原因和影响因素
- 提供具体的数据洞察
- 内容完整，不能截断
${adjustmentData ? `
- **店铺调整项目分析**：
  - 分析本周和上周的调整项目差异
  - 评估各调整项目对数据变化的潜在影响
  - 识别调整项目与关键指标变化的关联性
  - 基于调整项目提供针对性的改进建议
  - 分析调整项目的执行效果和优化方向` : ''}

## 5. 视觉美化要求
- 使用卡片式设计，添加阴影效果
- 合理的间距和留白
- 统一的颜色搭配
- 清晰的层次结构
- 专业的商务风格

**【重要】直接输出HTML代码，不要任何markdown格式，确保样式完整美观！**

现在生成专业的运营分析报告：
  `;
}