/*
    @author: chonker
    @version: 0.0.2
    @license: MPL 2.0
    @description: API for executing scripts in tabs.
*/

export const tab = {
    website: "https://www.crunchyroll.com",
    exec(details, url) {
        return browser.tabs.query({active: true}).then(tabs => {
            for(let _tab of tabs) {

                if(!(url === undefined && _tab.url.startsWith(tab.website) || _tab.url.startsWith(url))) continue;

                details.target = details.target || {};
                details.target.tabId = _tab.id;

                console.log(_tab.url)

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
                if(!_tab.url.startsWith(tab.website)) continue;
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