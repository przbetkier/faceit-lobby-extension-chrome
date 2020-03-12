import { getItem, setItem } from './storage';

function setupButton(elementId, storageKey) {
    const settingsElement = document.getElementById(elementId);
    settingsElement.addEventListener('click', () => toggleParam(storageKey));
    getItem(storageKey, result => settingsElement.checked = result[storageKey] === 'true');
}

function setupSelect(elementId, storageKey) {
    const selectElement = document.getElementById(elementId);
    getItem(storageKey, result => {
        const current = result[storageKey];
        switch (current) {
            case 'kd':
                selectElement.selectedIndex = 0;
                break;
            case 'count':
                selectElement.selectedIndex = 1;
                break;
            case 'winpercentage':
                selectElement.selectedIndex = 2;
                break;
            default:
                selectElement.selectedIndex = 0;
        }
    });

    selectElement.addEventListener('change', (event) => {
        let obj = {};
        obj[storageKey] = event.target.value;
        setItem(obj, () => console.log(`Successfully set ${storageKey} to ${event.target.value}`))
    });
}

window.onload = () => {
    setupButton('tuscan-enabled', 'enableTuscan');
    setupButton('stats-expanded', 'statsExpanded');
    setupSelect('map-order-select', 'mapOrderSelect')
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
