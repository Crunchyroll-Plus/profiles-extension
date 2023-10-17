/*
    @author: chonker
    @version: 0.0.2
    @license: MPL 2.0
    @description: API for sending requests to the Crunchyroll's backend.
*/

import { crunchyArray, crunchyProfile } from "../models/crunchyroll.js";
import { request } from "./request.js";
import { storage } from "./storage.js";

export const crunchyroll = {
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
    send: (info, callback, retry) => {
        request.send(
            info,
            (xml) => {
                // if(xml.status !== 200 && retry !== true) {
                //     fetch("https://www.crunchyroll.com/auth/v1/token", {
                //         method: "POST",
                //         headers: {
                //             "Authorization": "Basic bm9haWhkZXZtXzZpeWcwYThsMHE6",
                //             "Content-Type": "application/x-www-form-urlencoded"
                //         },
                //         body: "grant_type=etp_rt_cookie",
                //         credentials: "include"
                //     }).then(async response => {
                //         var js = await response.json();

                //         crunchyroll.token = js.access_token;
                //         browser.storage.local.set({access: crunchyroll.token});

                //         crunchyroll.send(info, callback, true);
                //     })
                // }
                
                callback(xml);
            },
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
                crunchyroll.content.URIs.discoverUser = "/discover/" + crunchyroll.user.account_id;
                crunchyroll.content.URIs.user = "/" + crunchyroll.user.account_id;
                crunchyroll.content.URIs.cmsUser = "/cms/" + crunchyroll.user.account_id;
            }
        },
        get: (type, link, callback, queryParams, before) => {
            storage.profile.get("meta", "current").then(current => {
                storage.profile.get(current, "profile").then(profile => {
                    profile = profile || new crunchyProfile();
                    try { crunchyroll.content.URIs.initiate(); } catch (error) { }

                    var queryString = "?";
                    
                    queryParams = queryParams || {};

                    queryParams.locale = profile.preferred_communication_language;
                    queryParams.preferred_audio_language = profile.preferred_content_audio_language;
                    
                    if(queryParams.ratings === false) delete queryParams.ratings
                    else queryParams.ratings = true;

                    for(const [key, value] of Object.entries(queryParams)) {
                        queryString += `${key}=${encodeURIComponent(value)}&`
                    }

                    queryString = queryString.substring(0, queryString.length - 1);

                    const url = crunchyroll.content.URIs.base + crunchyroll.content.URIs[type] + link + queryString 

                    crunchyroll.send({
                        url: url,
                        method: "GET"
                    }, (xml) => {
                        try { 
                            callback(new crunchyArray(JSON.parse(xml.response)))
                        } catch (error) {
                            callback(undefined)
                        }}, before)
                })
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
                "user",
                "/watch-history",
                query
            )
        },
        getWatchlist: (query) => {
            return crunchyroll.content.createPromise(
                "discoverUser",
                "/watchlist",
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
        },
        getUpNext: (id, query) => {
            return crunchyroll.content.createPromise(
                "discover",
                `/up_next/${id}`,
                query,
                (xml) => {
                    xml.setRequestHeader("Accept", "application/json, text/plain, */*")
                }
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

    crunchyroll.content.URIs.initiate();
})