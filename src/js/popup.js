
window.onload = () => {

document.getElementById("baton").addEventListener("click", changeParam);

    chrome.storage.sync.get("enableTuscan", function (result) {
        document.getElementById("baton").checked = result.enableTuscan === "true";
    });
};

function changeParam() {
    chrome.storage.sync.get("enableTuscan", function (result) {
        console.log('Value currently is ' + result.enableTuscan);
        let enabled = result.enableTuscan;

        if (enabled === "true") {
            chrome.storage.sync.set({"enableTuscan": "false"}, function () {
                console.log('Settings saved [false].');
            });
        } else {
            chrome.storage.sync.set({"enableTuscan": "true"}, function () {
                console.log('Settings saved [true]');
            });
        }
    })
}
