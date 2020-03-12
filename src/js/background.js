import { matchesRegex } from './main';
import { setItem } from './storage';

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    // Send message only if match room is visited
    if (changeInfo.url && matchesRegex(changeInfo.url)) {
        chrome.tabs.query({ active: true }, tabs => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, changeInfo.url);
            });
        });
    }
});

chrome.runtime.onInstalled.addListener(function (object) {
    setItem({ enableTuscan: 'true' }, () => console.log('Enabled tuscan extension'));
    setItem({ statsExpanded: 'true' }, () => console.log('Enabled tuscan extension'));
    setItem({ mapOrderSelect: 'kd' }, () => console.log('Ordering stats by kd.'));
});
