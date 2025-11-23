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
                customApiKey: settings.customApiKey
            })
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error || `请求失败: ${response.status}`);
        
        if (!responseData.candidates || !responseData.candidates[0]?.content) {
             if (responseData.promptFeedback?.blockReason) throw new Error(`安全拦截: ${responseData.promptFeedback.blockReason}`);
             throw new Error('API响应无效或内容为空。');
        }

        let content = responseData.candidates[0].content.parts[0].text;
        
        // ★★★ 增强的 JSON 解析逻辑 (兼容 Gemma) ★★★
        try {
            // 1. 尝试直接清理 Markdown
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e1) {
            // 2. 如果失败，尝试提取第一个 { 到最后一个 } 之间的内容
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error("无法从回复中提取 JSON");
            } catch (e2) {
                console.error("原始内容:", content);
                throw new Error("AI 返回了无法解析的内容 (JSON Error)。");
            }
        }

    } catch (error) {
        console.error("API调用失败:", error);
        throw error;
    }
}

export async function testServiceAvailability() {
    const settings = getSettings(); 
    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                isPing: true,
                customApiKey: settings.customApiKey
            })
        });

        const data = await response.json();
        if (!response.ok) return { success: false, message: data.error || "服务异常" };
        return { success: true, message: "服务连接正常" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}