const getItem = (key, resultConsumer) => {
    chrome.storage.sync.get(key, value => resultConsumer(value));
};

const setItem = (obj, resultConsumer) => {
    chrome.storage.sync.set(obj, value => resultConsumer(value));
};

export { getItem, setItem }