import { crunchyProfile } from "../../../api/models/crunchyroll.js";
import { storage } from "../../../api/scripts/storage.js";
import { tab } from "../../../api/scripts/tab.js";

browser.runtime.onMessage.addListener(async (request) => {
    if(typeof request !== "object" || request.type === undefined) return;
    
    switch(request.type) {
        case "new_profile":
            var profile = new crunchyProfile();
  
            profile.avatar = request.img;
            profile.username = request.username;
            
            storage.profile.getAll().then(async (values) => {
                var user = values.length === 0 ? values.length + 1 : values.length;

                storage.profile.set(user, "profile", profile);
                storage.profile.set("meta", "current", user);

                tab.closePopup();
                tab.runScript('window.location.href = "https://www.crunchyroll.com"');
            });
            break;
        case "import_history":
            // Import history.
            await storage.updateHistory(request.value);

            tab.updateAll();
            break;
        case "import_watchlist":
            // Import watchlist.
            var current = await storage.profile.get("meta", "current");
            
            storage.watchlist.set(current, "watchlist", request.value);
            tab.updateAll();
            break;
    }
  });

export default {
    loaded: true
}