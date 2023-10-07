const URLS = {
    token: "https://www.crunchyroll.com/auth/v1/token",
    message: "https://www.crunchyroll.com/fake/message*", // used for sending messages between tab and background scripts.
    home_feed: "https://www.crunchyroll.com/content/v2/discover/*/home_feed*",
    benefits: "https://www.crunchyroll.com/subs/v1/subscriptions/*/benefits",
    episode: "https://www.crunchyroll.com/content/v2/cms/objects/*?ratings=*&locale=*",
    github: "https://raw.githubusercontent.com",
    manga: {
        long: "https://www.crunchyroll.com/content/v3/*/manga?",
        short: "",
    },
    browse: "https://www.crunchyroll.com/content/v2/discover/browse",
    categories: "https://www.crunchyroll.com/content/v2/discover/categories?locale=*",
    me: "https://www.crunchyroll.com/accounts/v1/me",
    locale: "https://static.crunchyroll.com/i18n/cxweb/*.json",
    settings: {
        prefences: "https://www.crunchyroll.com/account/preferences"
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
        save: "https://www.crunchyroll.com/content/v2/*/watchlist?preferred_audio_language=*&locale=*",
        check_exist: "https://www.crunchyroll.com/content/v2/*/watchlist?preferred_audio_language=*&locale=*",
        history: "https://www.crunchyroll.com/content/v2/discover/*/watchlist?order=*&n=*",
        set: "https://www.crunchyroll.com/content/v2/*/watchlist/*?preferred_audio_language=*&locale=*",
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

const github = {
    official: {
        repo: "Derro8/Crunchyroll-Profiles/",
        branch: "main",
        feed_root: "feed"
    },
    getInfo: async () => {
        const link = await github.home_feed.getLink();

        parts = link.split("/").reverse();

        return {
            user: parts.pop(),
            repo: parts.pop(),
            branch: parts.pop(),
            other: parts.join("/")
        }
    },
    home_feed: {
        link: "",
        setLink: (link) => {
            github.home_feed.link = link;
            profileDB.stores.profile.set("meta", "home_feed_git", link);
        },
        getLink: () => {
            return new Promise((resolve, reject) => {
                try {
                    profileDB.stores.profile.get("meta", "home_feed_git").then((link) => {
                        github.home_feed.link = link === undefined ? `${github.official.repo}${github.official.branch}/${github.official.feed_root}` : link;
                        resolve(github.home_feed.link);
                    }, reject);
                } catch (error) { reject(error) };
            })
        },
        getFeed: (type) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const info = await github.getInfo();

                    if(info.repo === undefined || info.branch === undefined) return resolve();

                    const base_url = new URL([URLS.github, info.user, info.repo, info.branch, info.other].join("/"));
                    const metadata_url = new URL(`${base_url.href}/metadata.json`);

                    const metadata = await (await fetch(metadata_url.href)).json();

                    if(metadata.available_feeds.indexOf(type) === -1) return resolve();

                    const feed_url = new URL(`${base_url.href}${metadata.link}/${type}.json`);
                    const feed_data = await (await fetch(feed_url)).json();

                    feed_data.url = metadata.link.replaceAll("/", ";");

                    resolve(feed_data);
                } catch (error) { reject(error) };
            })
        }
    }
}