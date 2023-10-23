import { request } from "../../../../api/scripts/request.js";
import { crunchyroll } from "../../../../api/scripts/crunchyroll.js";
import { crunchyArray } from "../../../../api/models/crunchyroll.js";
import { config } from "../../../../api/config/index.js";
import { storage } from "../../../../api/scripts/storage.js";

const CONTINUE_WATCHING = config.URLS.get("history.continue_watching");
const WATCH_HISTORY = config.URLS.get("history.watch_history");
const PLAYHEADS = config.URLS.get("history.playheads");
const NEXT_UP = config.URLS.get("history.up_next");
const SEASON_EPISODES = config.URLS.get("history.season_episodes");
const SEASONS = config.URLS.get("history.seasons");

export default {
    listeners: [
        request.block([PLAYHEADS], "POST", async (info) => {
            const body = info.body;

            var current = await storage.profile.get("meta", "current");
            let history = (await storage.history.get(current, "episodes")) || { items: [] };

            var found_episode = history.items.find((item) => config.checkId(item, body.content_id));
            var exists = found_episode !== undefined;

            found_episode = exists ? found_episode : body;

            found_episode.content_id = body.content_id;
            found_episode.playhead = body.playhead;
            found_episode.date_played = (new Date()).toISOString();
            found_episode.panel = found_episode.panel === undefined ? (await crunchyroll.content.getObjects(found_episode.content_id)).result.data[0] : found_episode.panel;
            found_episode.id = found_episode.panel.id;
            found_episode.fully_watched = config.isFinished(found_episode);

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
              item.fully_watched = config.isFinished(item);
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
                var result = history.items.find((item) => config.checkId(item, id));
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
                if(item.fully_watched === true || config.isFinished(item)) {
                    var next_up = await crunchyroll.content.getUpNext(item.content_id);
                    
                    // If there is no next up episode, we can skip this series.
                    if(next_up === undefined) { 
                        used_series.push(item.panel.episode_metadata.series_id);
                        continue;
                    };

                    // Check if the next up exists in the watch history.
                    var h_item = history.items.find(it => it.id === next_up.result.data[0].panel.id)

                    if(h_item !== undefined) {
                        used_series.push(h_item.panel.episode_metadata.series_id);
                        continue;
                    };

                    // Get the next up episode.
                    next_up = next_up.result.data[0];

                    // Reassign the item to the next up episode.
                    item = {
                        panel: next_up.panel,
                        id: next_up.panel.id,
                        playhead: 0,
                        content_id: next_up.panel.id,
                        date_played: (new Date()).toISOString(),
                        fully_watched: false,
                    }
                };

                // Push the series_id to the used_series array.
                used_series.push(item.panel.episode_metadata.series_id);

                // Check if the episode is new.
                item.new = config.isNew(item);

                // Push the episode to the data crunchyArray.
                if(item.new) data.splice(0, 0, item)
                else data.push(item);
            }
            history.items.reverse();

            storage.history.set(current, "episodes", history);

            console.log(data.result.data)

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
        }),
        request.override([SEASONS], "GET", async (info) => {
            var data = new crunchyArray(info.body);

            var current = await storage.profile.get("meta", "current");
            var profile = await storage.profile.get(current, "profile");

            for(const season of data) {
                // Check if the audio locale is the profile's
                if(season.audio_locale === profile.preferred_content_audio_language) continue;

                // Set the season's id to the profile's audio locale
                season.id = season.versions.find(item => item.audio_locale === profile.preferred_content_audio_language).guid || season.identifier;
            }

            return data.toString();
        }),
        request.override([SEASON_EPISODES], "GET", async (info) => {
            var data = new crunchyArray(info.body);
            
            var current = await storage.profile.get("meta", "current");
            var profile = await storage.profile.get(current, "profile");

            for(const episode of data) {
                // Set recent_audio_locale to the preferred language.
                episode.recent_audio_locale = profile.preferred_content_audio_language;

                // Check if the episode is subbed and if it is then set the subtitle to the preferred language.
                if(episode.is_subbed === true) episode.subtitle_locales = [profile.preferred_content_subtitle_language];

                // Check if the episode is dubbed and if it is then set the audio to the preferred language.
                if(episode.is_dubbed === true) {
                    var index = -1;
                    var versions = episode.versions;

                    if(versions.find(item => item.audio_locale === profile.preferred_content_audio_language)) episode.audio_locale = profile.preferred_content_audio_language;
                    if((index = versions.findIndex(item => item.audio_locale === profile.preferred_communication_language)) !== -1) episode.versions[0] = versions.splice(index, 1, versions[0])[0]
                }
            }

            return data.toString();
        }),

    ]
}