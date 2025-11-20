import { systemPrompts } from './prompts.js';
import { getSettings } from './settings.js';

function dataUrlToGeminiPart(dataUrl) {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)[1];
    const base64Data = parts[1];
    return { inlineData: { mimeType, data: base64Data } };
}

/**
 * 直接调用 Google API 分析图片
 * @param {string} imageDataUrl 图片的base64数据
 * @param {string} aiType AI分析模式
 * @param {string} modelName 要使用的AI模型名称
 * @returns {Promise<object>} AI分析结果
 */
export async function analyzeImage(imageDataUrl, aiType, modelName) {
    const settings = getSettings();
    const apiKey = settings.googleApiKey;

    if (!apiKey) {
        throw new Error("请在设置中输入您的Google API Key。");
    }

    const GOOGLE_API_URL = `https://gemini.yamadaryo.me/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: systemPrompts[aiType] },
                    { text: "请分析这张图片并决定的：上还是不上？" },
                    dataUrlToGeminiPart(imageDataUrl)
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
        }
    };

    try {
        const response = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData.error?.message || `Google API 错误，状态码: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts) {
             console.error('从API返回的响应格式无效:', responseData);
             // 检查是否有安全提示
             if (responseData.promptFeedback && responseData.promptFeedback.blockReason) {
                 throw new Error(`请求被安全策略阻止: ${responseData.promptFeedback.blockReason}`);
             }
             throw new Error('从API返回的响应格式无效或内容为空。');
        }

        const content = responseData.candidates[0].content.parts[0].text;
        return JSON.parse(content);

    } catch (error) {
        console.error("直接调用Google API失败:", error);
        throw error;
    }
}

