const SETTINGS_KEY = 'fon_google_settings';

// 默认设置
const defaults = {
    googleApiKey: '',
    selectedModel: 'gemini-2.5-flash' // 默认使用Gemini 2.5 Flash模型
};

let settings = { ...defaults };

// 从本地存储加载设置
function loadFromLocalStorage() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        try {
            settings = { ...defaults, ...JSON.parse(stored) };
        } catch (e) {
            console.error("解析本地设置失败", e);
            settings = { ...defaults };
        }
    } else {
        settings = { ...defaults };
    }
}

// 保存设置到本地存储
function saveToLocalStorage() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings() {
    return { ...settings };
}

// 更新设置的函数
export function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    saveToLocalStorage();
}


// 初始化时加载一次设置
loadFromLocalStorage();


