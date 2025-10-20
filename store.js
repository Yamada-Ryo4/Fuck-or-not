const STORAGE_KEY = 'smashOrPassResults';

let savedResults = [];

function loadFromLocalStorage() {
    savedResults = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResults));
}

export function getSavedResults() {
    return [...savedResults];
}

export function addSavedResult(resultData) {
    savedResults.unshift(resultData);
    if (savedResults.length > 50) { // Keep max 50 results
        savedResults.pop();
    }
    saveToLocalStorage();
}

export function deleteSavedResult(index) {
    if (index >= 0 && index < savedResults.length) {
        savedResults.splice(index, 1);
        saveToLocalStorage();
    }
}

export function getDarkModePreference() {
    return localStorage.getItem('darkMode') === 'true';
}

export function setDarkModePreference(isDarkMode) {
    localStorage.setItem('darkMode', String(isDarkMode));
}

// Initial load
loadFromLocalStorage();