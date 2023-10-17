import { crunchyProfile } from "../../../api/models/crunchyroll.js";
import { crunchyroll } from "../../../api/scripts/crunchyroll.js";
import { storage } from "../../../api/scripts/storage.js";
import { tab } from "../../../api/scripts/tab.js";
import { config } from "../../../api/config/index.js";

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
            var current = await storage.profile.get("meta", "current");
            var removed = [];
            for(var item of request.value.items) {
                if(item.panel === undefined) {
                    let objects = await crunchyroll.content.getObjects(item.id);
                    
                    if(objects === undefined){ 
                        removed.push(item);
                        continue;
                    }

                    item.panel = objects.result.data[0];
                };
                // console.log(2)

                if(item.id === undefined || item.content_id === undefined) {
                    item.id = item.panel.id;
                    item.content_id = item.panel.id;
                };
                // console.log(3)

                if(item.fully_watched !== true) item.fully_watched = (item.panel.episode_metadata.duration_ms / 1000) - item.playhead <= config.MIN_MINUTES_LEFT;

                // console.log(4)
                if(item.date_played === undefined) item.date_played = (new Date()).toISOString();
                // console.log(5)
            }

            for(var item of removed) request.value.items.splice(request.value.items.indexOf(item), 1);

            storage.history.set(current, "episodes", request.value);
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