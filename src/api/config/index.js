export const config = {
    // Minimum amount of minutes left in a video before it's finished.
    MIN_MINUTES_LEFT: 3,
    // Check if the episode is finished.
    isFinished: (item) => ~~((item.panel.episode_metadata.duration_ms / 1000) - item.playhead) / 60 < config.MIN_MINUTES_LEFT,
    // Maximum amount of seconds to wait before opening a profile window.
    OPEN_PAGE_COOLDOWN: 3,
    // Maximum amount of days of a episode being released before it's not new.
    NEW_DAYS: 7,
    // Check if the item is new.
    isNew: (item) => {
        var metadata = item.series_id !== undefined ? item : (item.panel || item).episode_metadata;
        // console.log(item)
        return config.getDays(new Date(metadata.availability_starts), new Date()) < config.NEW_DAYS;
    },
    // Get the amount of days between two dates.
    getDays: (date1, date2) => Math.floor((date2.getTime() - date1.getTime()) / 86400000),
    // Checks the item's id.
    checkId: (item, id) => {
        var panel = item.panel || item;
        var metadata = panel.episode_metadata || panel.series_metadata;
        var found_version;

        if(!(metadata.versions && (found_version = metadata.versions.find(it => it.guid === id)) !== undefined || item.id === id || panel.id === id || item.content_id === id)) return;
        
        if(!found_version || !found_version.guid) return true;

        item.content_id = found_version.guid;
        item.id = found_version.guid;

        return true;
    },
    // Url patterns used for traffic.
    URLS: {
        items: {
            skip_events: "https://static.crunchyroll.com/skip-events/production/*.json",
            // intro: "https://static.crunchyroll.com/datalab-intro-v2/*.json",
            token: "https://www.crunchyroll.com/auth/v1/token",
            home_feed: "https://www.crunchyroll.com/content/v2/discover/*/home_feed*",
            benefits: "https://www.crunchyroll.com/subs/v1/subscriptions/*/benefits",
            episode: "https://www.crunchyroll.com/content/v2/cms/objects/*?ratings=*&locale=*",
            github: "https://raw.githubusercontent.com",
            browse: "https://www.crunchyroll.com/content/v2/discover/browse*",
            categories: "https://www.crunchyroll.com/content/v2/discover/categories?locale=*",
            me: "https://www.crunchyroll.com/accounts/v1/me",
            locale: "https://static.crunchyroll.com/i18n/cxweb/*.json",
            play: "https://cr-play-service.prd.crunchyrollsvc.com/v1/*/web/firefox/play",
            subtitles: "https://v.vrv.co/evs3/*/assets/*_*.txt?*",
            settings: {
                avatars: "https://www.crunchyroll.com/assets/v2/*/avatar",
                all: "https://www.crunchyroll.com/account/*",
                preferences: "https://www.crunchyroll.com/account/preferences"
            },
            assets: {
                fms: "https://static.crunchyroll.com/fms/*",
                avatar: "https://www.crunchyroll.com/assets/v2/*/avatar"
            },
            profile: {
                get: "https://www.crunchyroll.com/accounts/v1/me/profile",
                activation: "https://www.crunchyroll.com/profile/activation",
                new_profile: "https://www.crunchyroll.com/accounts/v1/me/credentials"
            },
            watchlist: {
                set: "https://www.crunchyroll.com/content/v2/*/watchlist/*?preferred_audio_language=*&locale=*",
                get: "https://www.crunchyroll.com/content/v2/*/watchlist?*",
                check_exist: "https://www.crunchyroll.com/content/v2/*/watchlist?preferred_audio_language=*&locale=*",
            },
            history: {
                playheads_batch: "https://www.crunchyroll.com/content/v2/*/playheads/batch*", // Isn't implemented yet but it could, also possible cross compatibility with other extensions like with "Improve Crunchyroll" @ https://github.com/ThomasTavernier/Improve-Crunchyroll
                mark_as_watched: "https://www.crunchyroll.com/content/v2/discover/*/mark_as_watched/*",// ^
                seasons: "https://www.crunchyroll.com/content/v2/cms/series/*/seasons?*",
                season_episodes: "https://www.crunchyroll.com/content/v2/cms/seasons/*/episodes?*",
                up_next: "https://www.crunchyroll.com/content/v2/discover/up_next/*",
                previous_episode: "https://www.crunchyroll.com/content/v2/discover/previous_episode/*",
                playheads: "https://www.crunchyroll.com/content/v2/*/playheads?*",
                watch_history: "https://www.crunchyroll.com/content/v2/*/watch-history*",
                continue_watching: "https://www.crunchyroll.com/content/v2/discover/*/history?locale=*&n=*&ratings=*"
                // ^ Can get this url from home_feed so might want to get it from there instead, same with watchlist.
            }
        },
        get: (id) => {
            if(!id.includes(".")) return config.URLS.items[id];

            var current_part = config.URLS.items;

            for(let part of id.split(".")) {
                var item = current_part[part];
                if(item == current_part || item === null || item === undefined) continue;
                current_part = item;
                if(typeof current_part === "string") break;
            }
            
            return current_part;
        }
    }
}