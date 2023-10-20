import { storage } from "../../../api/scripts/storage.js";

browser.runtime.onInstalled.addListener(async (details) => {
    switch(details.reason) {
        case "install":
            browser.tabs.create({
                url: "https://www.crunchyroll.com/profile/activation",
                active: true
            })
            break;
        case "update":
            if(details.previousVersion.startsWith("0.1") && parseInt(details.previousVersion.split(".")[2]) > 3) return;
            
            var check_loop = setInterval(async () => {
                if(storage.loaded !== true) return;
                clearInterval(check_loop);
                await storage.updateHistory();
            }, 500);

            break;
    }
});

export default {
    loaded: true
}