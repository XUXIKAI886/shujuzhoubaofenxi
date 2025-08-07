# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于Next.js 14构建的美团外卖数据统计周报系统，使用App Router架构。系统集成Gemini API生成专业的数据分析报告，支持店铺信息录入、运营数据分析和HTML报告导出。

## 核心技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS  
- **组件库**: shadcn/ui + Radix UI
- **表单验证**: Zod schema validation
- **AI集成**: Gemini API (通过自定义API客户端)
- **安全**: DOMPurify (HTML清理)

## 常用开发命令

### 开发环境
```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # ESLint代码检查
```

### 测试系统
```bash
npm run test         # 运行完整测试套件
npm run test:unit    # 单元测试
npm run test:component # 组件测试
npm run test:integration # 集成测试  
npm run test:e2e     # 端到端测试
npm run test:security # 安全测试
npm run test:watch   # 监听模式测试
npm run test:quick   # 快速测试
npm run test:coverage # 测试覆盖率报告
```

### 部署命令
```bash
# Vercel部署（推荐）
npm run build        # 验证构建是否成功
vercel               # 部署到Vercel

# 其他部署平台
npm run build && npm start  # 本地生产环境测试
```

## 核心架构模式

### 数据流架构
1. **表单组件** (`ShopInfoForm.tsx`, `DataInputForm.tsx`) → 收集用户输入
2. **数据验证** (`lib/validations.ts`) → Zod schema验证 
3. **API路由** (`app/api/generate-report/route.ts`) → 处理报告生成请求
4. **API客户端** (`lib/api-client.ts`) → 封装Gemini API调用，包含重试机制
5. **提示词系统** (`lib/prompt-templates.ts`) → 结构化AI提示词生成
6. **报告展示** (`ReportDisplay.tsx`) → 安全的HTML内容渲染

### 类型系统设计
- `ShopBasicInfo`: 店铺基础信息结构
- `PeriodData`: 周期性运营数据（本周/上周对比）
- `PromotionData`: 推广数据（可选模块）
- `ReportData`: 完整报告数据聚合
- `APIResponse`: 统一API响应格式

### 测试架构
使用自定义测试运行器 (`__tests__/test-runner.js`) 支持分层测试：
- **单元测试**: lib/目录下的工具函数和验证逻辑
- **组件测试**: React组件渲染和交互测试
- **集成测试**: API路由和数据流测试
- **安全测试**: XSS防护和输入验证测试
- **E2E测试**: 完整用户工作流程测试

## 关键开发注意事项

### API集成模式
- 使用环境变量配置API端点 (`API_BASE_URL`, `API_MODEL`)
- 实现60秒超时和3次重试机制，支持指数退避
- API密钥内置在客户端代码中（生产环境需要通过环境变量配置）
- 支持Gemini API格式，可扩展支持其他AI服务商

### 安全实践
- ⚠️ **注意**：当前代码中DOMPurify被完全绕过，HTML内容直接渲染（存在XSS风险）
- Zod验证所有用户输入，包含业务逻辑验证
- API路由实现错误边界处理
- 内置API密钥：`sk-5J05SHfZKhaBu4ysLuBQFBXJwtgJ6mZ8eHLmcNqG1ixOSKlL`（生产环境需要环境变量配置）

### 数据验证规则
- 整数字段：曝光人数、入店人数、下单人数等
- 百分比字段：转化率、复购率等（0-100%范围）
- 必填字段：店铺名称、品类、地址、营业时间

### 组件设计模式
- 使用shadcn/ui基础组件构建UI
- 表单组件与业务逻辑分离
- 加载状态统一管理 (`LoadingSpinner.tsx`)
- 响应式设计支持移动端

## 文件结构重点

```
app/api/generate-report/route.ts  # 核心API端点，处理报告生成
lib/api-client.ts                 # Gemini API集成，重试和错误处理
lib/prompt-templates.ts           # AI提示词模板系统，含详细HTML模板
lib/types.ts                      # 完整TypeScript类型定义
lib/validations.ts               # Zod验证schemas，含业务逻辑验证
lib/hooks/useLocalStorage.ts      # 数据持久化Hook
components/DataInputForm.tsx      # 核心数据输入组件（支持推广数据）
components/ReportDisplay.tsx      # 安全HTML报告渲染（DOMPurify净化）
__tests__/test-runner.js         # 自定义测试运行器（支持多种测试模式）
vercel.json                      # Vercel部署配置，包含安全头部
next.config.js                   # Next.js配置，安全头部和构建设置
```

## 扩展开发指南

### 添加新的数据字段
1. 更新 `lib/types.ts` 中的相关接口
2. 修改 `lib/validations.ts` 中的验证规则
3. 更新表单组件的输入字段
4. 调整 `lib/prompt-templates.ts` 中的提示词模板

### 集成新的AI服务
1. 扩展 `APIClient` 类支持多个提供商
2. 添加相应的环境变量配置
3. 实现统一的错误处理和重试逻辑
4. 更新类型定义以支持不同的响应格式

## 关键代码模式

### 核心组件架构：DataInputForm.tsx (970行)
```typescript
// 复杂的三列布局数据输入表单：
// 1. 本周数据（用户输入） | 2. 增长数据（用户输入） | 3. 上周数据（自动计算）
// 关键特性：
- NumberInput组件：支持整数/百分比输入，实时验证
- 店铺调整项目：17个选项，必选至少一个
- 推广数据模块：可选启用，包含推广曝光、点击、消费等
- localStorage持久化：useLocalStorage Hook自动保存表单数据
- 业务逻辑验证：本周 - 增长 = 上周（允许5%误差范围）
```

### API客户端重试机制
```typescript
// lib/api-client.ts 
// 实现了固定间隔重试策略：3次重试，每次间隔1秒
const maxRetries = 3;
const retryDelay = 1000; // 固定1秒间隔，非指数退避
// 60秒超时保护，内置API密钥：sk-5J05SHfZKhaBu4ysLuBQFBXJwtgJ6mZ8eHLmcNqG1ixOSKlL
```

### 数据验证层级
```typescript
// lib/validations.ts
// 1. 基础类型验证 (Zod schema)
// 2. 业务逻辑验证 (数据一致性)
// 3. 异常情况检测 (convertedRate允许5%误差)
// 4. 店铺调整项目验证 (17个选项，必选)
```

### 店铺调整项目枚举
```typescript
// lib/types.ts - 17个专业调整选项
export enum ShopAdjustmentOption {
  MARKET_RESEARCH = '商圈调研和店铺方案的制定',
  STORE_DESIGN = '店招海报头像的设计并上线',
  // ... 15个其他专业选项
}
```

### AI提示词系统
```typescript
// lib/prompt-templates.ts
// 结构化提示词生成，包含：
- 专业HTML模板（蓝色主题 #2563eb）
- 数据可视化表格设计
- 个性化建议生成逻辑
- 企业级报告格式规范
```

### 测试运行器使用
```bash
# 使用自定义测试运行器 __tests__/test-runner.js
node __tests__/test-runner.js all        # 完整测试套件
node __tests__/test-runner.js security   # 只运行安全测试
node __tests__/test-runner.js watch      # 监听模式
```

## 开发工作流程

### 添加新数据字段的完整流程
1. **类型定义** (`lib/types.ts`): 更新相关interface
2. **数据验证** (`lib/validations.ts`): 添加Zod验证规则
3. **表单组件** (`components/DataInputForm.tsx`): 添加NumberInput组件
4. **提示词模板** (`lib/prompt-templates.ts`): 更新AI分析逻辑
5. **测试覆盖** (`__tests__/`): 添加对应的单元测试和集成测试

### 调试常见问题
- **API超时**: 检查网络连接，API密钥是否有效
- **数据验证失败**: 查看浏览器console，检查Zod validation错误
- **报告生成失败**: 检查提示词模板格式，确保数据完整性
- **组件渲染异常**: 检查localStorage数据格式，清空缓存重试