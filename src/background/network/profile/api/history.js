import { request } from "../../../../api/scripts/request.js";
import { crunchyroll } from "../../../../api/scripts/crunchyroll.js";
import { crunchyArray } from "../../../../api/models/crunchyroll.js";
import { config } from "../../../../api/config/index.js";
import { storage } from "../../../../api/scripts/storage.js";

const CONTINUE_WATCHING = config.URLS.get("history.continue_watching");
const WATCH_HISTORY = config.URLS.get("history.watch_history");
const PLAYHEADS = config.URLS.get("history.playheads");
const NEXT_UP = config.URLS.get("history.up_next");

export default {
    listeners: [
        request.block([PLAYHEADS], "POST", async (info) => {
            let body = info.body;
            var current = await storage.profile.get("meta", "current");
            let history = (await storage.history.get(current, "episodes")) || { items: [] };

            let found_episode = history.items.find((item) => item.content_id === body.content_id);

            let exists = found_episode !== undefined;

            found_episode = exists ? found_episode : body;

            found_episode.content_id = body.content_id;
            found_episode.playhead = body.playhead;
            found_episode.date_played = (new Date()).toISOString();
            found_episode.panel = found_episode.panel === undefined ? (await crunchyroll.content.getObjects(found_episode.content_id)).result.data[0] : found_episode.panel;
            found_episode.id = found_episode.panel.id;
            found_episode.fully_watched = (found_episode.panel.episode_metadata.duration_ms / 1000) - found_episode.playhead < config.MIN_MINUTES_LEFT;

            if(!exists) history.items.push(found_episode);
            
            storage.history.set(current, "episodes", history);

            return true;
        }),
        request.block([WATCH_HISTORY], "DELETE", async (info) => {
            var current = await storage.profile.get("meta", "current");
            var history = await storage.history.get(current, "episodes");
            var id = info.details.url.split("watch-history")[1].split("?")[0].split("/")[1];

            if(history === undefined) return true;

            if(id === undefined) history.items = [];

            for(let i in history.items) {
                let item = history.items[i];
                
                if(item.id !== id) continue;

                history.items.splice(i, 1);
                break;
            }

            storage.history.set(current, "episodes", history);

            return true;
        }),
        request.override([NEXT_UP], "GET", async (info) => {
            var current = await storage.profile.get("meta", "current");
            var episodes = await storage.history.get(current, "episodes");
          
            if(episodes === undefined || info.body === "") return info.body;
          
            const data = new crunchyArray(info.body);
            var ids = info.details.url.split("/up_next/")[1].split("?")[0].split(",");
            
            episodes.items.reverse();
          
            for(var id of ids) {
              var history_item = episodes.items.find(hitem => hitem.panel.episode_metadata.series_id === id);
          
              if(history_item === undefined) continue;
          
              var item = data.find(it => it.panel.episode_metadata.series_id === id);
          
              item.playhead = history_item.playhead;
              item.never_watched = item.playhead;
              item.fully_watched = ((item.panel.episode_metadata.duration_ms / 1000) - item.playhead) / 60 < config.MIN_MINUTES_LEFT;
              item.panel = history_item.panel;
            }
          
            return data.toString();
        }),
        request.override([PLAYHEADS], "GET", async (info) => {
            var data = new crunchyArray();
            var paramaters = request.getURLParams(info);

            var content_ids = paramaters.get("content_ids").split(",");

            var current = await storage.profile.get("meta", "current");
            var history = await storage.history.get(current, "episodes");

            if(history === undefined) return data.toString();

            for(const id of content_ids) {
                var result = history.items.find((item) => item.content_id === id);
                if(result === undefined) continue;
                data.push(result);
            }

            return data.toString();
        }),
        request.override([CONTINUE_WATCHING], "GET", async (info) => {
            var data = new crunchyArray();
            var paramaters = request.getURLParams(info);

            let amount = parseInt(paramaters.get("n"));

            var current = await storage.profile.get("meta", "current");            
            let history = await storage.history.get(current, "episodes");

            var used_series = [];

            if(history === undefined) return data.toString();

            history.items.reverse();

            for(var item of history.items) {
                // Break once we've reached the amount of episodes.
                if(data.result.length === amount) break;

                // Check if we've used the episode's series id.
                if(used_series.includes(item.panel.episode_metadata.series_id)) continue;

                // Check if the user has finished the episode.
                if(item.fully_watched === true || ((item.panel.episode_metadata.duration_ms / 1000) - item.playhead) / 60 < config.MIN_MINUTES_LEFT) {
                    var next_up = await crunchyroll.content.getUpNext(item.content_id);
                    if(next_up === undefined) continue;

                    var h_item = history.items.find(it => it.id === next_up.result.data[0].panel.id)

                    if(h_item !== undefined) {
                        used_series.push(h_item.panel.episode_metadata.series_id);
                        continue;
                    };

                    next_up = next_up.result.data[0];

                    item.fully_watched = true;

                    item = {
                        panel: next_up.panel,
                        id: next_up.panel.id,
                        date_played: (new Date()).toISOString(),
                        fully_watched: next_up.fully_watched
                    }
                    
                    item.content_id = item.id;
                };

                // Push the series_id to the used_series array.
                used_series.push(item.panel.episode_metadata.series_id);

                // Check if the episode is new.
                item.new = getDays(new Date(item.panel.episode_metadata.availability_starts), new Date()) < config.NEW_DAYS;

                // Push the episode to the data crunchyArray.
                data.push(item);
            }

            history.items.reverse();

            storage.history.set(current, "episodes", history);

            return data.toString();
        }),
        request.override([WATCH_HISTORY], "GET", async (info) => {
            var data = new crunchyArray();
            var paramaters = request.getURLParams(info);

            let page_size = parseInt(paramaters.get("page_size"));
            let page = parseInt(paramaters.get("page")) || 1;

            if(page_size > 100 && page === 1) return info.body;

            let start_index = (page - 1) * page_size;
            let end_index = start_index + page_size;

            var current = await storage.profile.get("meta", "current");
            var history = (await storage.history.get(current, "episodes")) || { items: [] };

            history.items.reverse();

            var user_id = info.details.url.split("/v2/")[1].split("/")[0];

            data.set("next_page", "")
            data.set("prev_page", "")

            if(history.items.length > end_index) 
                data.set("next_page", `/content/v2/${user_id}/watch-history?locale=${paramaters.get("locale")}&page=${page + 1}&page_size=${page_size}`)
            
            if(page > 1)
                data.set("prev_page", `/content/v2/${user_id}/watch-history?locale=${paramaters.get("locale")}&page=${page - 1}&page_size=${page_size}`)

            data.result.data = history.items.slice(start_index, end_index);

            data.result.total = history.items.length;
            data.result.meta.total_before_filter = history.items.length;

            return data.toString();
        })
    ]
}

function getDays(date1, date2) {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
    return Math.floor((utc2 - utc1) / 86400000);
  }