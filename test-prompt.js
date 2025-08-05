// 测试脚本：验证提示词是否包含推广数据要求
const { buildReportPrompt } = require('./lib/prompt-templates.ts');

// 模拟有推广数据的报告数据
const testData = {
  shopInfo: {
    shopName: "测试店铺",
    category: "快餐",
    address: "测试地址",
    businessHours: "09:00 - 21:00"
  },
  operationData: {
    thisWeek: {
      exposureCount: 10834,
      visitCount: 685,
      visitConversionRate: 6.32,
      orderConversionRate: 10.8,
      orderCount: 74,
      repurchaseRate: 5.1
    },
    lastWeek: {
      exposureCount: 6306,
      visitCount: 346,
      visitConversionRate: 5.52,
      orderConversionRate: 9.8,
      orderCount: 34,
      repurchaseRate: 6.4
    }
  },
  promotionData: {
    thisWeek: {
      cost: 1500,
      exposureCount: 5000,
      visitCount: 250,
      visitRate: 5.0,
      costPerVisit: 6.0
    },
    lastWeek: {
      cost: 1200,
      exposureCount: 4500,
      visitCount: 200,
      visitRate: 4.4,
      costPerVisit: 6.0
    }
  },
  generatedAt: new Date().toISOString()
};

try {
  const prompt = buildReportPrompt(testData);
  console.log("=== 提示词预览 ===");
  console.log(prompt);
  
  // 检查关键词是否存在
  const hasPromotionRequirement = prompt.includes("核心数据总览表格必须包含点金推广数据");
  const hasPromotionStructure = prompt.includes("推广花费：本周¥1500");
  
  console.log("\n=== 验证结果 ===");
  console.log("包含推广数据要求:", hasPromotionRequirement ? "✅" : "❌");
  console.log("包含推广数据结构:", hasPromotionStructure ? "✅" : "❌");
  
  if (hasPromotionRequirement && hasPromotionStructure) {
    console.log("🎉 提示词修复成功！");
  } else {
    console.log("⚠️  提示词需要进一步修复");
  }
} catch (error) {
  console.error("测试失败:", error.message);
}