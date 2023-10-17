export const config = {
    // Minimum amount of minutes left in a video before it's finished.
    MIN_MINUTES_LEFT: 3,
    // Maximum amount of seconds to wait before opening a profile window.
    OPEN_PAGE_COOLDOWN: 3,
    // Maximum amount of days of a episode being released before it's not new.
    NEW_DAYS: 7,
    // Url patterns used for traffic.
    URLS: {
        items: {
            token: "https://www.crunchyroll.com/auth/v1/token",
            home_feed: "https://www.crunchyroll.com/content/v2/discover/*/home_feed*",
            benefits: "https://www.crunchyroll.com/subs/v1/subscriptions/*/benefits",
            episode: "https://www.crunchyroll.com/content/v2/cms/objects/*?ratings=*&locale=*",
            github: "https://raw.githubusercontent.com",
            browse: "https://www.crunchyroll.com/content/v2/discover/browse*",
            categories: "https://www.crunchyroll.com/content/v2/discover/categories?locale=*",
            me: "https://www.crunchyroll.com/accounts/v1/me",
            locale: "https://static.crunchyroll.com/i18n/cxweb/*.json",
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
                seasons: "https://www.crunchyroll.com/content/v2/cms/series/*/seasons?*",
                up_next: "https://www.crunchyroll.com/content/v2/discover/up_next/*?preferred_audio_language=*&locale=*",
                playheads: "https://www.crunchyroll.com/content/v2/*/playheads*",
                watch_history: "https://www.crunchyroll.com/content/v2/*/watch-history*",
                continue_watching: "https://www.crunchyroll.com/content/v2/discover/*/history?locale=*&n=*&ratings=*"
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