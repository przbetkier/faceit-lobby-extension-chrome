import { getItem, setItem } from './storage';

function setupButton(elementId, storageKey) {
    const settingsElement = document.getElementById(elementId);
    settingsElement.addEventListener('click', () => toggleParam(storageKey));
    getItem(storageKey, result => settingsElement.checked = result[storageKey] === 'true');
}

window.onload = () => {
    setupButton('tuscan-enabled', 'enableTuscan');
    setupButton('stats-expanded', 'statsExpanded');
};

const toggleParam = (param) => {
    getItem(param,
        result => {
            const enabled = result[param];
            const obj = {};
            if (enabled === 'true') {
                obj[param] = 'false';
                setItem(obj, () => {});
            } else {
                obj[param] = 'true';
                setItem(obj, () => {});
            }
        }
    );
};