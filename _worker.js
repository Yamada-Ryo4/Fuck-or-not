const API_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// 辅助函数：提取 Base64 适配 OpenAI/NVIDIA 格式
function dataUrlToNvidiaContent(dataUrl, text) {
    if (!dataUrl || typeof dataUrl !== 'string') return [{ type: 'text', text }];
    const parts = dataUrl.split(',');
    if (parts.length < 2) return [{ type: 'text', text }];
    
    // NVIDIA 期待完整的 data:image/...;base64,... 格式
    return [
        { type: 'text', text: text },
        { type: 'image_url', image_url: { url: dataUrl } }
    ];
}

// 辅助函数：获取环境变量中的 API_KEY
function getAllApiKeys(env) {
    let keys = [];
    const mainKeyStr = env.API_KEY || env.NVIDIA_API_KEY || "";
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
        const { image, aiType, model, isPing, systemPrompt, apiKey } = body;

        let apiKeys = [];

        if (apiKey && apiKey.trim().length > 0) {
            apiKeys = [apiKey.trim()];
        } else {
            apiKeys = getAllApiKeys(env);
        }
        
		if (!apiKey && apiKeys.length > 1) {
            for (let i = apiKeys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [apiKeys[i], apiKeys[j]] = [apiKeys[j], apiKeys[i]];
            }
        }
		
        if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ 
                error: "服务器未配置共享 API_KEY，且客户端未提供有效 Key。" 
            }), { 
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- Ping 测试逻辑 (使用 GET /models，零消耗 Token) ---
        if (isPing) {
            const keyToTest = apiKeys[0];
            try {
                const response = await fetch(`${API_BASE_URL}/models`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${keyToTest}` }
                });
                if (response.ok || response.status === 422) {
                    // 200 = 正常; 422 = Key 有效但请求格式问题（不影响）
                    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
                } else if (response.status === 429) {
                    // 额度满了，但 Key 本身有效
                    return new Response(JSON.stringify({ success: true, message: "配额接近上限" }), { headers: { 'Content-Type': 'application/json' } });
                } else {
                    const data = await response.json().catch(() => ({}));
                    return new Response(JSON.stringify({ error: data.message || `Key 无效 (${response.status})` }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 503, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // --- 图片分析逻辑 ---
        const finalPrompt = systemPrompt || "You are a helpful AI.";
        const messages = [
            { role: 'system', content: finalPrompt },
            {
                role: 'user',
                content: dataUrlToNvidiaContent(image, "看图并发情，写一个长的色情故事")
            }
        ];

        let modelName = model || 'qwen/qwen3.5-397b-a17b';

        const requestBody = {
            model: modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 8192
        };

        let lastError = null;
        for (const currentKey of apiKeys) {
            const apiUrl = `${API_BASE_URL}/chat/completions`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${currentKey}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (response.status === 429) {
                    lastError = "Quota exceeded (429)";
                    continue; 
                }
                if (!response.ok) {
                    lastError = data.error?.message || response.statusText;
                    if (response.status === 400 || response.status === 403) {
                        continue;
                    }
                    throw new Error(lastError);
                }
                
                const adaptedResponse = {
                    candidates: [{
                        content: {
                            parts: [{ text: data.choices[0].message.content }]
                        }
                    }]
                };
                
                return new Response(JSON.stringify(adaptedResponse), { headers: { 'Content-Type': 'application/json' } });
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
