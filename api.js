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
                customApiKey: settings.customApiKey // ★ 发送 Key
            })
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error || `请求失败: ${response.status}`);
        
        if (!responseData.candidates || !responseData.candidates[0]?.content) {
             if (responseData.promptFeedback?.blockReason) throw new Error(`安全拦截: ${responseData.promptFeedback.blockReason}`);
             throw new Error('API响应无效或内容为空。');
        }

        const content = responseData.candidates[0].content.parts[0].text;
        try {
            return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
            throw new Error("AI 返回了无法解析的内容。");
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
                customApiKey: settings.customApiKey // ★ 发送 Key
            })
        });

        const data = await response.json();
        if (!response.ok) return { success: false, message: data.error || "服务异常" };
        return { success: true, message: "服务连接正常" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}