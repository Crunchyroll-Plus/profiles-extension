import { request } from "../../../../api/scripts/request.js";
import { crunchyroll } from "../../../../api/scripts/crunchyroll.js";
import { crunchyArray } from "../../../../api/models/crunchyroll.js";
import { config } from "../../../../api/config/index.js";
import { storage } from "../../../../api/scripts/storage.js";
import { tab } from "../../../../api/scripts/tab.js";

const GET = config.URLS.get("watchlist.get");
const SET = config.URLS.get("watchlist.set");
// const EXIST = config.URLS.get("watchlist.check_exist");

export default {
    listeners: [
        request.override([GET], "GET", async (info) => {
            var data = new crunchyArray();
            var paramaters = request.getURLParams(info);
            
            var ids = paramaters.get("content_ids");
            var order = paramaters.get("order");

            var current = await storage.profile.get("meta", "current");
            var watchlist = await storage.watchlist.get(current, "watchlist");
            var amount = parseInt(paramaters.get("n"));

            if(order !== null) {
                if(order === "desc" || order === null) watchlist.items.reverse();
                
                var start = parseInt(paramaters.get("start")) | 0;

                data.result.data = watchlist.items.slice(start, start + amount);
                data.result.total = data.result.data.length;
                data.result.meta.total_before_filter = watchlist.items.length;
                
                return data.toString();
            }

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

            data.result.data = watchlist.items.reverse().slice(0, amount);
            data.result.total = data.result.data.length;
            data.result.meta.total_before_filter = watchlist.items.length;

            return data.toString();
        }),
        request.block([GET], "POST", async (info) => {
            var data = JSON.parse(info.body);

            var current = await storage.profile.get("meta", "current");
            if(current === undefined) return true;

            var watchlist = await storage.watchlist.get(current, "watchlist");
            if(watchlist == undefined) return true;

            var item = watchlist.items.find(item => item.panel.episode_metadata.series_id === data.content_id);
            if(item !== undefined) return true;

            var panel = (await crunchyroll.content.getUpNext(data.content_id)).result.data[0];
            if(panel === undefined) return true;

            panel.is_favorite = false;
            panel.new = getDays(new Date(panel.panel.episode_metadata.availability_starts), new Date()) < config.NEW_DAYS;

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

function getDays(date1, date2) {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
    return Math.floor((utc2 - utc1) / 86400000);
}