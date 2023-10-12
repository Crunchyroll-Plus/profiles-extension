const crunchyroll = {
    token: "",
    locale: {},
    benefits: {},
    categories: [
        "drama",
        "comedy",
        "romance",
        "harem",
        "sci-fi",
        "action",
        "adventure",
        "fantasy",
        "music",
        "seinen",
        "shojo",
        "shonen",
        "slice of life",
        "sports",
        "supernatural",
        "thriller",
        "historical",
        "isekai",
        "mystery",
        "idols",
        "mecha",
        "post-apocalyptic"
    ],
    send: (info, callback) => {
        request.send(
            info,
            callback,
            (xml) => {
                fetch("https://www.crunchyroll.com/auth/v1/token", {
                    method: "POST",
                    headers: {
                        "Authorization": "Basic bm9haWhkZXZtXzZpeWcwYThsMHE6",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "grant_type=etp_rt_cookie",
                    credentials: "include"
                }).then(async response => {
                    json = await response.json();

                    crunchyroll.token = json.access_token;
                })

                xml.setRequestHeader("Authorization", "Bearer " + crunchyroll.token);
            }
        )
    },
    content: {
        URIs: {
            base: "https://www.crunchyroll.com/content/v2",
            discover: "/discover",
            cms: "/cms",
            initiate: () => {
                crunchyroll.content.URIs.discoverUser = "/discover/" + crunchyroll.user.account_id;
                crunchyroll.content.URIs.cmsUser = "/cms/" + crunchyroll.user.account_id;
            }
        },
        get: (type, link, callback, queryParams, before) => {
            profileDB.stores.profile.get(storage.currentUser, "profile").then(profile => {
                crunchyroll.content.URIs.initiate();

                var queryString = "?";
                
                queryParams = queryParams || {};

                queryParams.locale = profile.preferred_communication_language;
                queryParams.preferred_audio_language = profile.preferred_content_audio_language;
                queryParams.ratings = true;

                for(const [key, value] of Object.entries(queryParams)) {
                    queryString += `${key}=${encodeURIComponent(value)}&`
                }

                queryString = queryString.substring(0, queryString.length - 1);

                const url = crunchyroll.content.URIs.base + crunchyroll.content.URIs[type] + link + queryString 

                crunchyroll.send({
                    url: url,
                    method: "GET"
                }, (xml) => callback(new crunchyArray(JSON.parse(xml.response))), before)
            })
        },
        createPromise: (type, url, query) => {
            return new Promise((resolve, reject) => {
                try{
                    crunchyroll.content.get(
                        type,
                        url,
                        resolve,
                        query
                    )
                } catch (error) { reject(error) }
            })
        },
        getHistory: (query) => {
            return crunchyroll.content.createPromise(
                "discoverUser",
                "/history",
                query
            )
        },
        getSimilarSeriesFromGUID: (guid, query) => {
            return crunchyroll.content.createPromise(
                "discoverUser",
                `/similar_to/${guid}`,
                query
            )
        },
        getObjects: (ids, query) => {
            ids = typeof(ids) === "object" ? ids : [ids];

            return crunchyroll.content.createPromise(
                "cms",
                `/objects/${ids.join(",")}`,
                query
            )
        },
        getSeries: (ids, query) => {
            ids = typeof(ids) === "object" ? ids : [ids];

            return crunchyroll.content.createPromise(
                "cms",
                `/series/${ids.join(",")}`,
                query
            )
        }
    },
    getAvatars: (callback) => {
        crunchyroll.send(
            {
                url: "https://www.crunchyroll.com/assets/v2/" + getLocale() + "/avatar",
                method: "GET",
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Host": "www.crunchyroll.com",
                    "Referer": "https://www.crunchyroll.com/account/prefences",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0"
                }
            },
            (xml) => {
                callback(JSON.parse(xml.response));
            }
        )
    }
}

class crunchyProfile {
    constructor(data) {
        this.profile = data || {
            "avatar": "0001-cr-white-orange.png",
            "cr_beta_opt_in": true,
            "crleg_email_verified": true,
            "email": "profile@crunchyroll.com",
            "extended_maturity_rating": {
                "BR": "16"
            },
            "maturity_rating": "M3",
            "preferred_communication_language": getLocale(),
            "preferred_content_audio_language": "ja-JP",
            "preferred_content_subtitle_language": getLocale(),
            "qa_user": false,
            "wallpaper": undefined,
            "username": "Profile"
        };

        this.avatar = this.profile.avatar;
        this.cr_beta_opt_in = this.profile.cr_beta_opt_in;
        this.crleg_email_verified = this.profile.crleg_email_verified;
        this.email = this.profile.email;
        this.extended_maturity_rating = this.profile.extended_maturity_rating;
        this.maturity_rating = this.profile.maturity_rating;
        this.preferred_communication_language = this.profile.preferred_communication_language;
        this.preferred_content_audio_language = this.profile.preferred_content_audio_language;
        this.preferred_content_subtitle_language = this.profile.preferred_content_subtitle_language;
        this.qa_user = this.profile.qa_user;
        this.username = this.profile.username;
    }
}

class crunchyIterator {
    constructor(items) {
        this.items = items;
        this.index = 0;
    }
    next() {
        if(this.index >= this.items.length) throw StopIteration;

        this.index++;

        return this.items[this.index];
    }
}

class crunchyArray {
    constructor(data) {
        this.result = (data === undefined || data.code !== undefined) && {
            total: 0,
            data: [],
            meta: {
                total_before_filter: 0
            }
        }
        || typeof(data) === "string" && JSON.parse(data)
        || data.items !== undefined && {
            total: data.items.length,
            data: data.items,
            meta: {
                total_before_filter: data.items.length
            }
        }
        || data.toString !== undefined && data
        || data
    }
    toString() {
        return JSON.stringify(this.result);
    }

    [Symbol.iterator] = function*() {
        yield* this.result.data;
    }

    push(item) {
        this.result.total++;
        this.result.meta.total_before_filter++;

        this.result.data.push(item);
    }

    reverse() {
        this.result.data.reverse();
    }

    set(key, value) {
        this.meta.set(key, value);
    }

    pop(index) {
        if(index < 0) return;

        this.result.total--;
        this.result.meta.total_before_filter--;

        this.result.data.splice(index, 1);
    }

    sort(callbackfn) {
         this.result.data = this.result.data.sort(callbackfn);
    }
    map(callbackfn) {
        this.result.data = this.result.data.map(callbackfn);
    }

    indexOf(callbackfn) {
        return this.result.data.indexOf(callbackfn);
    }
    find(callbackfn) {
        return this.result.data.find(callbackfn);
    }
    splice(...args) {
        return this.result.data.splice(...args);
    }

    filter(callbackfn){
        if(this.result.meta.total_before_filter === this.result.data.length) {
            this.result.meta.total_before_filter = this.result.data.length;
        };

        this.result.data = this.result.data.filter(callbackfn);
    }

    async sortBy(...keys) {
        var watchlist = new crunchyArray(await profileDB.stores.watchlist.get(storage.currentUser, "watchlist"));
        var history = new crunchyArray(await profileDB.stores.history.get(storage.currentUser, "episodes"));

        for(var key of [...keys]) {
            switch (key) {
                case "watched":
                    this.filter((item) => {
                        var item_type = item.type;

                        var episode_check = item_type === "episode";
                        var series_check = item_type === "series";

                        var item_id = series_check && item.id || episode_check && item.episode_metadata.series_id;

                        let watched_callback = (_item) => {
                            var panel = _item.panel || _item;
                            return panel.episode_metadata.series_id === item_id
                        }

                        if(history.find(watched_callback) !== undefined) return true;
                        else return watchlist.find(watched_callback) !== undefined;
                    })
            
                    break;
                case "not_watched":
                    var used = [];
                    this.filter((item) => {
                        var item_type = item.type;

                        var episode_check = item_type === "episode";
                        var series_check = item_type === "series";

                        var item_id = series_check && item.id || episode_check && item.episode_metadata.series_id;
                        
                        let not_watched_callback = (_item) => {
                            let panel = _item.panel || _item;
                            if(!(panel.episode_metadata.series_id === item_id)) return;

                            var result = used.find(it => it.episode_metadata.series_id === panel.episode_metadata.series_id)
                            var resultCheck = result !== undefined

                            result = resultCheck && result.panel || result;

                            if(resultCheck && (panel.episode_metadata.sequence_number <= result.episode_metadata.sequence_number || panel.episode_metadata.season_number <= result.episode_metadata.season_number)) return;
                            
                            var finish_check = MIN_MINUTES_LEFT > ((panel.episode_metadata.duration_ms / 1000) - _item.playhead) / 60 && (panel.episode_metadata.sequence_number >= item.series_metadata.episode_count || panel.episode_metadata.season_number >= item.series_metadata.season_count);
                            
                            if(finish_check){
                                used.push(panel);
                                return;
                            }
                            
                            return _item;
                        }

                        history.reverse();

                        var history_check = history.find(not_watched_callback) !== undefined

                        history.reverse();

                        if(history_check) return true;
                        else return watchlist.find(not_watched_callback) !== undefined;

                        // var watchlist_check = watchlist.find(not_watched_callback) !== undefined

                        // // console.log("|DEBUG| Filter not watched item checks: ", episode_check, series_check, history_check, watchlist_check);

                        // return (
                        //     history_check || watchlist_check
                        // );
                    })
            
                    break;
            }
        }
    }
}

browser.storage.local.get("access").then(item => {
    crunchyroll.token = item.access;
})

browser.storage.local.get("benefits").then(item => {
    crunchyroll.benefits = item.benefits || {};
})

browser.storage.local.get("user_data").then(item => {
    const user_data = item.user_data || {};

    user_data.created = new Date(user_data.created);

    crunchyroll.user = user_data;
})