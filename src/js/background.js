import {matchesRegex} from "./main";

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    // Send message only if match room is visited
    if (changeInfo.url && matchesRegex(changeInfo.url)) {
        chrome.tabs.query({active: true}, tabs => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, changeInfo.url);
            });
        });
    }
});

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.storage.sync.set({"enableTuscan": "true"}, function () {
        console.log("Enabled tuscan extension.");
    });
});
