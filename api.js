import { systemPrompts } from './prompts.js';
import { getSettings } from './settings.js';

export async function analyzeImage(imageDataUrl, aiType, modelName) {
    const settings = getSettings(); 
    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: imageDataUrl,
                aiType: aiType, 
                systemPrompt: systemPrompts[aiType], 
                model: modelName,
                isPing: false,
                apiKey: settings.apiKey
            })
        });

        let responseData = {};
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const rawText = await response.text();
            if (response.status === 524 || response.status === 504) {
                throw new Error('💔 服务器响应超时 (524/504)。原因：AI 生成内容过长或模型繁忙，请稍后重试或尝试更快的模型。');
            }
            throw new Error(`服务器返回了非 JSON 响应 (${response.status})。请检查网络。`);
        }

        if (!response.ok) throw new Error(responseData.error || `请求失败: ${response.status}`);
        
        // 兼容适配层格式 (已经在 _worker.js 中处理成为了 candidates 结构)
        if (!responseData.candidates || !responseData.candidates[0]?.content) {
             throw new Error('API响应无效或内容为空。');
        }

        let content = responseData.candidates[0].content.parts[0].text;
        
        // --- 增强型 JSON 解析逻辑 ---
        let cleaned = content.trim();
        
        // 1. 移除 Markdown 代码块标记包围
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();

        try {
            return JSON.parse(cleaned);
        } catch (e1) {
            // 2. 如果标准解析失败，尝试修复常见的 LLM JSON 错误（如字符串中的原始换行符）
            try {
                // 找到 explanation 字段的内容并进行换行符转义
                // 这是一个启发式修复：匹配 "explanation": "..." 结构，处理其中的换行
                const fixedContent = cleaned.replace(/("explanation":\s*")([\s\S]*?)("\s*\})/g, (match, p1, p2, p3) => {
                    return p1 + p2.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + p3;
                });
                return JSON.parse(fixedContent);
            } catch (e2) {
                // 3. 最后的挣扎：使用正则提取各个字段 (极度容错)
                try {
                    const verdictMatch = cleaned.match(/"verdict":\s*"([^"]+)"/);
                    const ratingMatch = cleaned.match(/"rating":\s*(\d+|"[^"]+")/);
                    const explanationMatch = cleaned.match(/"explanation":\s*"([\s\S]*?)"(?=\s*[,}])|$/);
                    
                    if (verdictMatch && ratingMatch) {
                        return {
                            verdict: verdictMatch[1],
                            rating: ratingMatch[1].toString().replace(/"/g, ''),
                            explanation: explanationMatch ? explanationMatch[1].trim() : "解析失败，但评分已提取"
                        };
                    }
                } catch (e3) {
                    console.error("所有解析方法均失败。原始内容:", content);
                }
                throw new Error("AI 返回了无法解析的内容 (JSON Error)。");
            }
        }

    } catch (error) {
        console.error("API调用失败:", error);
        throw error;
    }
}

export async function testServiceAvailability(model) {
    const settings = getSettings(); 
    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                isPing: true,
                model: model || 'mistralai/ministral-14b-instruct-2512',
                apiKey: settings.apiKey
            })
        });

        const data = await response.json();
        if (!response.ok) return { success: false, message: data.error || "服务异常" };
        return { success: true, message: "服务连接正常" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}