/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: API for executing scripts in tabs.
*/

export const tab = {
    websites: [
        "https://www.crunchyroll.com",
    ],
    exec(details, url) {
        return browser.tabs.query({active: true}).then(tabs => {
            for(let _tab of tabs) {
                if(url === undefined && tab.websites.find(item => _tab.url.startsWith(item)) === undefined || !_tab.url.startsWith(url)) continue;

                details.target = details.target || {};
                details.target.tabId = _tab.id;

                browser.scripting.executeScript(details);
            }
        })
    },
    updateAll() {
        return tab.runScript("window.location.reload();")
    },
    runScript(code) {
        return browser.tabs.query({windowId: 1}).then(tabs => {
            for(let _tab of tabs) {
                if(tab.websites.find(item => _tab.url.startsWith(item)) === undefined) continue;
                browser.tabs.executeScript(
                    _tab.id,
                    {
                        code: code,
                    }
                )
            }
        })
    },
    closePopup() {
        return browser.tabs.query({active: true}).then(tabs => {
            for(let tab of tabs) {
                if(tab.windowId !== 1 && tab.index === 0) browser.tabs.remove(tab.id);
            }
        });
    }
}