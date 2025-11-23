--- START OF FILE _worker.js ---

const API_BASE_URL = 'https://gemini.yamadaryo.me';

// 辅助函数：提取 Base64
function dataUrlToGeminiPart(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const match = parts[0].match(/:(.*?);/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Data = parts[1];
    return { inlineData: { mimeType, data: base64Data } };
}

// 辅助函数：获取环境变量中的 Keys
function getAllApiKeys(env) {
    let keys = [];
    const mainKeyStr = env.API_KEYS || env.GEMINI_API_KEY || env.API_KEY || "";
    if (mainKeyStr) {
        keys = keys.concat(mainKeyStr.split(/[\s,]+/).filter(k => k.trim().length > 0));
    }
    for (let i = 1; i <= 10; i++) {
        const k = env[`API_KEY${i}`];
        if (k && k.trim().length > 0) keys.push(k.trim());
    }
    return [...new Set(keys)];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/submit") {
        if (request.method !== "POST") {
            return new Response("Method Not Allowed. Use POST.", { status: 405 });
        }
        return handleSubmit(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleSubmit(request, env) {
    try {
        const body = await request.json();
        const { image, aiType, model, isPing, systemPrompt, customApiKey } = body;

        let apiKeys = [];

        if (customApiKey && customApiKey.trim().length > 0) {
            apiKeys = [customApiKey.trim()];
        } else {
            apiKeys = getAllApiKeys(env);
        }
        
		if (!customApiKey && apiKeys.length > 1) {
            for (let i = apiKeys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [apiKeys[i], apiKeys[j]] = [apiKeys[j], apiKeys[i]];
            }
        }
		
        if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ 
                error: "服务器未配置共享 API Key，且未提供自定义 Key。" 
            }), { 
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Ping 测试逻辑 ---
        if (isPing) {
            let lastError = null;
            for (const apiKey of apiKeys) {
                const checkUrl = `${API_BASE_URL}/v1beta/models?key=${apiKey}&pageSize=1`;
                try {
                    const response = await fetch(checkUrl, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();

                    if (response.ok && !data.error) {
                        return new Response(JSON.stringify({ 
                            success: true, 
                            message: customApiKey ? "Custom Key Valid" : "Cloud Key Valid" 
                        }), { headers: { 'Content-Type': 'application/json' } });
                    } else {
                        lastError = data.error?.message || response.statusText;
                        continue; 
                    }
                } catch (err) {
                    lastError = err.message;
                    continue;
                }
            }
            return new Response(JSON.stringify({ error: `连通性测试失败: ${lastError}` }), { 
                status: 503, headers: { 'Content-Type': 'application/json' } 
            });
        }

        // --- 图片生成逻辑 ---
        const contents = [];
        const imagePart = dataUrlToGeminiPart(image);
        if (!imagePart) return new Response(JSON.stringify({ error: "无效图片" }), { status: 400 });
        
        const finalPrompt = systemPrompt || "You are a helpful AI.";
        contents.push({
            role: "user",
            parts: [
                { text: finalPrompt },
                { text: "请分析这张图片并决定的：上还是不上？" },
                imagePart
            ]
        });

        let modelName = model || 'gemini-2.5-flash';

        // ★★★ 关键修改：针对 Gemma 模型禁用 JSON Mode ★★★
        const isGemma = modelName.toLowerCase().includes('gemma');
        
        const requestBody = {
            contents: contents,
            // 如果是 Gemma，不传 generationConfig 或传空对象
            // 如果是 Gemini，强制要求 JSON
            generationConfig: isGemma ? {} : { responseMimeType: "application/json" }
        };

        let lastError = null;
        for (const apiKey of apiKeys) {
            const apiUrl = `${API_BASE_URL}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (response.status === 429 || (data.error && data.error.code === 429)) {
                    lastError = "Quota exceeded";
                    continue; 
                }
                if (!response.ok) {
                    const msg = data.error?.message || response.statusText;
                    if (response.status === 400 || response.status === 403) {
                        lastError = msg;
                        continue;
                    }
                    throw new Error(msg);
                }
                return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
            } catch (err) {
                lastError = err.message;
                continue;
            }
        }

        return new Response(JSON.stringify({ error: `请求失败: ${lastError}` }), { 
            status: 503, headers: { 'Content-Type': 'application/json' } 
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: `Server Error: ${err.message}` }), { status: 500 });
    }
}