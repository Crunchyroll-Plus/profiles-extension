/*
    @author: chonker
    @version: 0.0.2
    @license: MPL 2.0
    @description: API for controlling indexDB and local storage.
*/

import { StorageDB, StoreObject } from "../models/storage.js";
import { config } from "../config/index.js";
import { crunchyroll } from "./crunchyroll.js";

export const Settings = {
    default: {
        genreFeed: true,
        compactHistory: false,
        newDubs: false,
        onlyNewWatched: false,
        fixSeasons: false,
    },
    get: (key) => {
        return new Promise((resolve, reject) => {
            browser.storage.local.get("settings").then((item) => {
                item.settings = item.settings || Settings.default;

                var value = key === "*" && item.settings || item.settings[key] !== undefined && item.settings[key] || Settings.default[key];
                
                resolve(value);
            }, reject);
        })
    },
    set: (key, value) => {
        return new Promise((resolve, reject) => {
            browser.storage.local.get("settings").then((item) => {
                item.settings = item.settings || {};

                item.settings[key] = value || Settings.default[key];

                browser.storage.local.set(item).then(resolve);
            }, reject);
        })
    }
}


export class ProfileDB extends StorageDB {
    constructor(callback) {
        super("profileDB", 8, callback, ProfileStore, "profile", "history", "watchlist");
    }
}

export class ProfileStore extends StoreObject {
    constructor(store, database) {
        super(store, database);
    }

    async get(user, key) {
        return new Promise((resolve, reject) => {
            return super.get(user).then((result) => {
                return resolve(result !== undefined ? result[key] : undefined);
            }, reject);
        });
    }
    async set(user, key, value) {
        return new Promise((resolve, reject) => {
            return super.get(user).then((result) => {
                if(result === undefined) {
                    result = {};
                } else {
                    super.delete(user);
                }

                result[key] = value;

                
                return super.set(user, result).then(() => {resolve(value)}, () => {reject(new Error("Couldn't set " + key + " to " + value))});
            }, reject);
        });
    }
};

export const storage = {
    onload: () => {},
    loaded: false,
    updateHistory: async (history) => {
        var current = await storage.profile.get("meta", "current");

        if(history === undefined)
            history = await storage.history.get(current, "episodes");
        
        var removed = [];

        for(var item of history.items) {
            if(item.panel === undefined) {
                let objects = await crunchyroll.content.getObjects(item.id);
                
                if(objects === undefined){ 
                    removed.push(item);
                    continue;
                }

                item.panel = objects.result.data[0];
            };

            if(item.id === undefined || item.content_id === undefined) {
                item.id = item.panel.id;
                item.content_id = item.panel.id;
            };

            if(item.fully_watched !== true) item.fully_watched = config.isFinished(item);
            if(item.date_played === undefined) item.date_played = (new Date()).toISOString();
        }

        history.items.reverse();
        for(var item of removed) history.items.splice(history.items.indexOf(item), 1);

        storage.history.set(current, "episodes", history);
    },
    database: new ProfileDB(() => {
        storage.database.stores.profile.get("meta", "current").then(current => {
            storage.current = current;
            storage.profile = storage.database.stores.profile;
            storage.history = storage.database.stores.history;
            storage.watchlist = storage.database.stores.watchlist;
            storage.onload();
            storage.loaded = true;
        })
        try { github.home_feed.getLink() } catch { };
    }),
    setCurrent: (id) => {
        storage.profile.set("meta", "current", id);
        storage.current = id;
    },
}