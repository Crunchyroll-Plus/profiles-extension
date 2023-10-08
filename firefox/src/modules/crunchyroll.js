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
        this.result = data === undefined && {
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

        this.push = (item) => {
            this.result.total++;
            this.result.meta.total_before_filter++;

            this.result.data.push(item);
        }

        this.sort = (callbackfn) => this.result.data = this.result.data.sort(callbackfn);
        this.map = (callbackfn) => this.result.data = this.result.data.map(callbackfn);
        this.indexOf = (callbackfn) => this.result.data.indexOf(callbackfn);
        this.find = (callbackfn) => this.result.data.find(callbackfn);
        this.splice = (...args) => this.result.data.splice(...args);

        this.filter = (callbackfn) => {
            if(this.result.meta.total_before_filter === this.result.data.length) {
                this.result.meta.total_before_filter = this.result.data.length;
            };

            this.result.data = this.result.data.filter(callbackfn);
        }

        this.reverse = () => {
            this.result.data.reverse();
        }

        this.pop = (index) => {
            if(index < 0) return;

            this.result.total--;
            this.result.meta.total_before_filter--;

            this.result.data.splice(index, 1);
        }


        this.set = (key, value) => {
            this.meta[key] = value;
        }

        this[Symbol.iterator] = function* () {
            yield* this.result.data;
        }
    }
    toString() {
        return JSON.stringify(this.result);
    }
}

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
    ], // Some categories are missing from the response so I'm going to have to type them in manually.
    send: (info, callback) => {
        request.send(
            info,
            callback,
            (xml) => {
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
                crunchyroll.content.URIs.discoverUser =
            "/discover/" + crunchyroll.user.account_id;
                
                crunchyroll.content.URIs.cmsUser =
            "/cms/" + crunchyroll.user.account_id;
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