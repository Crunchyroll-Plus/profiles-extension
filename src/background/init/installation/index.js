import { storage } from "../../../api/scripts/storage.js";

browser.runtime.onInstalled.addListener((details) => {
    switch(details.reason) {
        // TODO: Add export option when you uninstall.
        case "install":
            browser.tabs.create({
                url: "https://www.crunchyroll.com/profile/activation#install",
                active: true
            })
            break;
        case "update":
            var version = parseInt(details.previousVersion.split(".")[2])
            
            if(details.previousVersion.startsWith("0.1") && version > 3) return;

            storage.onload = async () => {
                await storage.updateHistory();
            }
            
            break;
    }
});

export default {
    loaded: true
}