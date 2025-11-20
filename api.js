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

    // 注意：这里使用了你的自定义反代地址
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
        // --- 新增：安全设置 (全部设为不拦截) ---
        safetySettings: [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_CIVIC_INTEGRITY",
                "threshold": "BLOCK_NONE"
            }
        ],
        // -------------------------------------
        generationConfig: {
            responseMimeType: "application/json",
            // 稍微提高温度，增加一点创造性（可选）
            temperature: 0.9 
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
                 // 即使设置了 BLOCK_NONE，极端内容仍可能被 Google 强制阻断，这里保留报错提示以便排查
                 throw new Error(`请求被安全策略阻止 (BlockReason: ${responseData.promptFeedback.blockReason})。尽管已设置为不拦截，但内容可能触犯了Google的核心底线。`);
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
