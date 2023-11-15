import { crunchyProfile } from "../../../api/models/crunchyroll.js";
import { storage } from "../../../api/scripts/storage.js";
import { tab } from "../../../api/scripts/tab.js";
import { crunchyroll } from "../../../api/scripts/crunchyroll.js";

async function scanHistory(page, result) {
    page = page || 1;
    result = result !== undefined && result.length !== undefined && result || [];

    let data = await crunchyroll.content.getHistory({
        original: true,
        page_size: 300,
        page: page
    });

    if(data.result.meta.next_page.length > 0) {
        let list = [...data.result.data] || [];

        if(page === 1) {
            await storage.updateHistory({items: list.reverse()});
            data = list
        }
        else data = [...list, ...result];

        return await scanHistory(page + 1, data);
    }

    return result;
}

browser.runtime.onMessage.addListener(async (request) => {
    if(typeof request !== "object" || request.type === undefined) return;
    switch(request.type) {
        // case "print":
        //     console.log(...request.value);
        //     break;
        case "first_profile":
            var profile = new crunchyProfile();
            profile.avatar = request.img;
            profile.username = request.username;

            storage.profile.set(0, "profile", profile);
            storage.profile.set("meta", "current", 0);

            (async () => {
                let history = await scanHistory();

                await storage.updateHistory({items: history});
            })();

            crunchyroll.content.getWatchlist({
                original: true,
                start: 0,
                n: 1000
            }).then(watchlist => {
                watchlist.map(item => {
                    item.new = false;

                    return item;
                })

                storage.watchlist.set(0, "watchlist", {items: watchlist.result.data.reverse()});
            })

            tab.closePopup();
        case "new_profile":
            var profile = new crunchyProfile();
  
            profile.avatar = request.img;
            profile.username = request.username;
            
            storage.profile.getAll().then(async (values) => {
                var user = values.length

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