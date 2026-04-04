const SETTINGS_KEY = 'fon_nvidia_settings';

const defaults = {
    selectedModel: 'qwen/qwen3.5-397b-a17b',
    apiKey: ''
};

let settings = { ...defaults };

function loadFromLocalStorage() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            settings = { ...defaults, ...parsed };
        } catch (e) {
            settings = { ...defaults };
        }
    } else {
        // 尝试从旧 key 迁移
        const oldStored = localStorage.getItem('fon_google_settings');
        if (oldStored) {
            try {
                const oldParsed = JSON.parse(oldStored);
                settings.apiKey = oldParsed.customApiKey || '';
            } catch (e) {}
        }
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