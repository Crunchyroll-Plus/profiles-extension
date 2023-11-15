import { request } from "../../../../api/scripts/request.js";
import { crunchyroll } from "../../../../api/scripts/crunchyroll.js";
import { crunchyArray } from "../../../../api/models/crunchyroll.js";
import { config } from "../../../../api/config/index.js";
import { storage } from "../../../../api/scripts/storage.js";

const GET = config.URLS.get("watchlist.get");
const SET = config.URLS.get("watchlist.set");

export default {
    listeners: [
        request.override([GET], "GET", async (info) => {
            var data = new crunchyArray();
            var paramaters = request.getURLParams(info);
            if(paramaters.get("original") !== null) return info.body;
            var ids = paramaters.get("content_ids");

            var current = await storage.profile.get("meta", "current");
            var watchlist = await storage.watchlist.get(current, "watchlist");
            if(watchlist === undefined) return data.toString();

            var amount = parseInt(paramaters.get("n"));
            var start = parseInt(paramaters.get("start")) | 0;

            if(amount >= 1000) return info.body;

            if(ids !== null) {
                for(var id of ids.split(",")) {
                    var item = watchlist.items.find(item => item.panel.episode_metadata.series_id === id);
                    if(item === undefined) continue;

                    data.push({
                        id: item.panel.episode_metadata.series_id,
                        is_favorite: item.is_favorite,
                        date_added: (new Date()).toISOString()
                    })
                }

                return data.toString();
            }

            var order = paramaters.get("order");

            var is_favorite = paramaters.get("is_favorite");
            var is_subbed = paramaters.get("is_subbed");
            var is_dubbed = paramaters.get("is_dubbed");

            if(is_favorite === "true") watchlist.items = watchlist.items.filter(item => item.is_favorite === true)
            if(is_dubbed === "true") watchlist.items = watchlist.items.filter(item => item.panel.episode_metadata.is_dubbed === true)
            if(is_subbed === "true") watchlist.items = watchlist.items.filter(item => item.panel.episode_metadata.is_subbed === true)

            watchlist.items.sort(item => item.is_favorite === true)

            data.result.data = watchlist.items.reverse().slice(start, start + amount);
            data.result.total = watchlist.items.length;
            data.result.meta.total_before_filter = watchlist.items.length;
           
            switch(order){
                case "desc":
                    break;
                case "asc":
                    data.reverse();
                    break;
            }

            return data.toString();
        }),
        request.block([GET], "POST", async (info) => {
            var data = info.body

            var current = await storage.profile.get("meta", "current");
            if(current === undefined) return true;
            var profile = await storage.profile.get(current, "profile");
            var watchlist = (await storage.watchlist.get(current, "watchlist")) || {items: []};

            var item = watchlist.items.find(item => item.panel.episode_metadata.series_id === data.content_id);
            if(item !== undefined) return true;

            var panel = await crunchyroll.content.getNext(data.content_id);
            if(panel.result.data[0] === undefined) return true;

            panel = panel.result.data[0];

            panel.is_favorite = false;
            panel.new = config.isNew(panel);

            delete panel.shortcut;

            watchlist.items.push(panel);
            storage.watchlist.set(current, "watchlist", watchlist);

            return true;
        }),
        request.block([SET], ["DELETE", "PATCH"], async (info) => {
            var current = await storage.profile.get("meta", "current");
            var watchlist = await storage.watchlist.get(current, "watchlist");
            
            var id = info.details.url.split("?")[0].split("/watchlist/")[1];

            switch(info.details.method) {
                case "DELETE":
                    var index = watchlist.items.findIndex(item => item.panel.episode_metadata.series_id === id);
                    if(index !== -1) watchlist.items.splice(index, 1);
                    break;
                case "PATCH":
                    var index = watchlist.items.findIndex(item => item.panel.episode_metadata.series_id === id);

                    for(const [key, value] of Object.entries(info.body)) {
                        watchlist.items[index][key] = value;
                    }
                    break;
            }

            storage.watchlist.set(current, "watchlist", watchlist);
            return true;
        })
    ]
}