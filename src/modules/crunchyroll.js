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

class crunchyArray {
    constructor() {
        this.result = {
            total: 0,
            data: [],
            meta: {
                total_before_filter: 0
            }
        }

        this.push = (item) => {
            this.result.total++;
            this.result.meta.total_before_filter++;

            this.result.data.push(item);
        }

        this.pop = (index) => {
            if(index < 0) return;

            this.result.total--;
            this.result.meta.total_before_filter--;

            this.result.data.pop(index);
        }

        this.set = (key, value) => {
            this.meta[key] = value;
        }

        this.stringify = () => {
            return JSON.stringify(this.result);
        }
    }
}

const crunchyroll = {
    token: "",
    locale: {},
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