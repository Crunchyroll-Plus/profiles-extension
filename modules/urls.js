const URLS = {
    token: "https://www.crunchyroll.com/auth/v1/token",
    message: "https://www.crunchyroll.com/fake/message*", // used for sending messages between tab and background scripts.
    settings: {
        prefences: "https://www.crunchyroll.com/account/preferences"
    },
    assets: {
        avatar: "https://www.crunchyroll.com/assets/v2/*/avatar"
    },
    profile: {
        get: "https://www.crunchyroll.com/accounts/v1/me/profile",
        activation: "https://www.crunchyroll.com/profile/activation",
        new_profile: "https://www.crunchyroll.com/accounts/v1/me/credentials"
    },
    watchlist: {
        save: "https://www.crunchyroll.com/content/v2/*/watchlist?preferred_audio_language=*&locale=*",
        check_exist: "https://www.crunchyroll.com/content/v2/*/watchlist?preferred_audio_language=*&locale=*",
        history: "https://www.crunchyroll.com/content/v2/discover/*/watchlist?order=*&n=*",
        get: "https://www.crunchyroll.com/content/v2/*/watchlist?content_ids=*&preferred_audio_language=*&locale=*",
        watchlist: "https://www.crunchyroll.com/content/v2/discover/*/watchlist?locale=*&n=*"
    },
    history: {
        series: "https://www.crunchyroll.com/content/v2/cms/seasons/*/episodes?preferred_audio_language=*&locale=*",
        up_next: "https://www.crunchyroll.com/content/v2/discover/up_next/*?preferred_audio_language=*&locale=*",
        delete: "https://www.crunchyroll.com/content/v2/*/watch-history*",
        playheads: "https://www.crunchyroll.com/content/v2/*/playheads?content_ids=*&locale=*",
        save_playhead: "https://www.crunchyroll.com/content/v2/*/playheads?preferred_audio_language=*&locale=*",
        watch_history: "https://www.crunchyroll.com/content/v2/*/watch-history?*",
        continue_watching: "https://www.crunchyroll.com/content/v2/discover/*/history?locale=*&n=*&ratings=*"
    }
};