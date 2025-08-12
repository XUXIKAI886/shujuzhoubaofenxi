import { ReportData, APIResponse } from './types';
import { buildReportPrompt } from './prompt-templates';

export class APIClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor() {
    // 优先使用环境变量，如果没有则使用默认值
    this.baseUrl = process.env.API_BASE_URL || 'https://jeniya.top/v1/chat/completions';
    this.model = process.env.API_MODEL || 'gemini-2.5-flash-lite';
    // 内置API密钥
    this.apiKey = 'sk-AHP64E0ntf5VEltYLSV17wTLYeV4WZ3ucJzf72u0UHXf0Hos';
  }

  async generateReport(data: ReportData): Promise<APIResponse> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = buildReportPrompt(data);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时，给AI更多时间生成完整内容

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 8000,
            stream: false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '无法获取错误详情');
          throw new Error(`API请求失败 (${response.status}): ${response.statusText}. 详情: ${errorText}`);
        }

        const result = await response.json();
        
        if (result.choices && result.choices[0]?.message?.content) {
          return {
            success: true,
            data: result.choices[0].message.content
          };
        } else {
          throw new Error('API返回格式错误: 未找到有效的回复内容');
        }
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        
        if (error instanceof Error && error.name === 'AbortError') {
          if (isLastAttempt) {
            return {
              success: false,
              error: '请求超时，请检查网络连接或稍后重试'
            };
          }
        } else if (isLastAttempt) {
          return {
            success: false,
            error: `API请求失败 (尝试 ${attempt}/${maxRetries}): ${errorMessage}`
          };
        }
        
        // 在重试之前等待
        if (!isLastAttempt) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    return {
      success: false,
      error: '所有重试尝试均失败'
    };
  }
}