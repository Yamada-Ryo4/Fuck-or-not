const SETTINGS_KEY = 'fon_google_settings';

const defaults = {
    selectedModel: 'gemini-2.5-flash',
    customApiKey: ''
};

let settings = { ...defaults };

function loadFromLocalStorage() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // 合并逻辑，防止旧设置覆盖新字段
            settings = { ...defaults, ...parsed };
        } catch (e) {
            settings = { ...defaults };
        }
    } else {
        settings = { ...defaults };
    }
}

function saveToLocalStorage() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings() {
    return { ...settings };
}

export function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    saveToLocalStorage();
}

loadFromLocalStorage();