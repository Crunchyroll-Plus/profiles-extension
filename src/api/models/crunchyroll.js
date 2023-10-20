/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: A script that'll be used for Crunchyroll classes.
*/

import { locale } from "../scripts/locale.js";

export class crunchyProfile {
    constructor(data) {
        data = data || {
            "avatar": "0001-cr-white-orange.png",
            "cr_beta_opt_in": true,
            "crleg_email_verified": true,
            "email": "profile@crunchyroll.com",
            "extended_maturity_rating": {
                "BR": "16"
            },
            "maturity_rating": "M3",
            "preferred_communication_language": locale.lang,
            "preferred_content_audio_language": "ja-JP",
            "preferred_content_subtitle_language": locale.lang,
            "qa_user": false,
            "wallpaper": undefined,
            "username": "Profile"
        };

        this.avatar = data.avatar;
        this.cr_beta_opt_in = data.cr_beta_opt_in;
        this.crleg_email_verified = data.crleg_email_verified;
        this.email = data.email;
        this.extended_maturity_rating = data.extended_maturity_rating;
        this.maturity_rating = data.maturity_rating;
        this.preferred_communication_language = data.preferred_communication_language;
        this.preferred_content_audio_language = data.preferred_content_audio_language;
        this.preferred_content_subtitle_language = data.preferred_content_subtitle_language;
        this.qa_user = data.qa_user;
        this.username = data.username;
    }
}

export class crunchyIterator {
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

export class crunchyArray {
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
        this.result.meta[key] = value;
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

    // async sortBy(...keys) {
    //     var watchlist = new crunchyArray(await profileDB.stores.watchlist.get(storage.currentUser, "watchlist"));
    //     var history = new crunchyArray(await profileDB.stores.history.get(storage.currentUser, "episodes"));

    //     for(var key of [...keys]) {
    //         switch (key) {
    //             case "watched":
    //                 this.filter((item) => {
    //                     var item_type = item.type;

    //                     var episode_check = item_type === "episode";
    //                     var series_check = item_type === "series";

    //                     var item_id = series_check && item.id || episode_check && item.episode_metadata.series_id;

    //                     let watched_callback = (_item) => {
    //                         var panel = _item.panel || _item;
    //                         return panel.episode_metadata.series_id === item_id
    //                     }

    //                     if(history.find(watched_callback) !== undefined) return true;
    //                     else return watchlist.find(watched_callback) !== undefined;
    //                 })
            
    //                 break;
    //             case "not_watched":
    //                 var used = [];
    //                 this.filter((item) => {
    //                     var item_type = item.type;

    //                     var episode_check = item_type === "episode";
    //                     var series_check = item_type === "series";

    //                     var item_id = series_check && item.id || episode_check && item.episode_metadata.series_id;
                        
    //                     let not_watched_callback = (_item) => {
    //                         let panel = _item.panel || _item;
    //                         if(!(panel.episode_metadata.series_id === item_id)) return;

    //                         var result = used.find(it => it.episode_metadata.series_id === panel.episode_metadata.series_id)
    //                         var resultCheck = result !== undefined

    //                         result = resultCheck && result.panel || result;

    //                         if(resultCheck && (panel.episode_metadata.sequence_number <= result.episode_metadata.sequence_number || panel.episode_metadata.season_number <= result.episode_metadata.season_number)) return;
                            
    //                         var finish_check = config.MIN_MINUTES_LEFT > ((panel.episode_metadata.duration_ms / 1000) - _item.playhead) / 60 && (panel.episode_metadata.sequence_number >= item.series_metadata.episode_count || panel.episode_metadata.season_number >= item.series_metadata.season_count);
                            
    //                         if(finish_check){
    //                             used.push(panel);
    //                             return;
    //                         }
                            
    //                         return _item;
    //                     }

    //                     history.reverse();

    //                     var history_check = history.find(not_watched_callback) !== undefined

    //                     history.reverse();

    //                     if(history_check) return true;
    //                     else return watchlist.find(not_watched_callback) !== undefined;

    //                     // var watchlist_check = watchlist.find(not_watched_callback) !== undefined

    //                     // // console.log("|DEBUG| Filter not watched item checks: ", episode_check, series_check, history_check, watchlist_check);

    //                     // return (
    //                     //     history_check || watchlist_check
    //                     // );
    //                 })
            
    //                 break;
    //         }
    //     }
    // }
}