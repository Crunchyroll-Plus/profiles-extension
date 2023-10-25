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
// const SKIP_EVENTS = config.URLS.get("skip_events");
const INTRO = config.URLS.get("intro");

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
            var profile = await storage.profile.get(current, "profile");

            var id = info.details.url.split("/up_next/")[1].split("?")[0];

            // if(info.body === "" && info.details.url.includes("?locale=") === true) {
            //     var episode = (await crunchyroll.content.getObjects(id)).result.data[0];

            //     var watchlist = await storage.watchlist.get(current, "watchlist");
            //     if(watchlist === undefined) return JSON.stringify(data);

            //     var next_watchlist = watchlist.items.findIndex(item => item.panel.episode_metadata.series_id === episode.series_id);
            //     if(next_watchlist === -1 || next_watchlist + 1 === watchlist.items.length) next_watchlist = watchlist.items[watchlist.items.length - 1];
            //     else next_watchlist = watchlist.items[next_watchlist + 1];
            //     var item = await crunchyroll.content.getNext(next_watchlist.panel.episode_metadata.series_id)
            //     console.log(item)


            //     return item.toString();
            // }

            if(episodes === undefined || info.body === "") return info.body;
          
            const data = new crunchyArray(info.body);
            
            episodes.items.reverse();

            var item = data.result.data[0];

            var metadata = item.panel.episode_metadata;

            var index = -1;
            var versions = metadata.versions;

            if(versions !== null && (index = versions.findIndex(item => item.audio_locale === profile.preferred_communication_language)) !== -1) metadata.versions[0] = versions.splice(index, 1, versions[0])[0]

            var history_item = episodes.items.find(item => config.checkId(item, data.result.data[0].panel.id)) 

            if(history_item !== undefined) {
                item = history_item;
            } else  {
                item.playhead = 0;
                item.never_watched = true;
                item.fully_watched = false;
            }

            item.never_watched = item.playhead === 0;
            item.fully_watched = config.isFinished(item);
          
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
                        playhead: -1,
                        content_id: next_up.panel.id,
                        date_played: new Date(item.date_played).getTime() > new Date(item.panel.episode_metadata.availability_starts).getTime() ? item.date_played : item.panel.episode_metadata.availability_starts,
                        fully_watched: false,
                    }
                };

                // Push the series_id to the used_series array.
                used_series.push(item.panel.episode_metadata.series_id);

                // Check if the episode is new.
                item.new = config.isNew(item);

                // Push the episode to the data crunchyArray.
                data.push(item)
            }
            history.items.reverse();
            storage.history.set(current, "episodes", history);

            data.sort((a, b) =>
                // Sort by date
                new Date(b.date_played).getTime() - new Date(a.date_played).getTime()
            );
            
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
        // Uncomment when this is actually implemented into crunchyroll.
        // request.override([SKIP_EVENTS], "GET", async (info) => {
        //     var data = {
        //         lastUpdate: (new Date()).toISOString(),
        //         mediaId: info.details.url.split("/production/")[1].split(".json")[0]
        //     };

        //     if(!info.body.startsWith("<?xml")) {
        //         data = JSON.parse(info.body);
        //     }

        //     if(data.credits === undefined) {
        //         var episode = (await crunchyroll.content.getNext(data.mediaId)).result.data[0];
        //         var panel = episode.panel;
        //         var metadata = panel.episode_metadata;

        //         data.credits = {
        //             start: ~~(metadata.duration_ms / 1000 - config.MIN_MINUTES_LEFT * 60),
        //             end: ~~(metadata.duration_ms / 1000), 
        //             seriesId: metadata.series_id,
        //             type: "credits"
        //         };
        //     }

        //     console.log(data);

        //     return JSON.stringify(data);
        // }),
    ]
}