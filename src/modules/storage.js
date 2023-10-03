// Old storage module kept just for converting.

const storage = {
    currentUser: "",
    getUsers: (callback) => {
        return browser.storage.local.get("profiles").then((item) => {
            if(item.profiles === undefined) {
                item.profiles = {current: 0, others: [0]}
            }
            browser.storage.local.set({profiles: item.profiles})
            
            return callback(item.profiles)
        })
    },
    get: (user, key, callback) => {
        return browser.storage.local.get(user.toString()).then((item) => {
            if(item[user.toString()] == undefined) {
                item[user.toString()] = {}
            }

            return callback(item[user.toString()][key], item)
        })
    },
    set: (user, key, value) => {
        return browser.storage.local.get(user.toString()).then((item) => {
            if(item[user.toString()] == undefined) {
                item[user.toString()] = {}
            }

            item[user.toString()][key] = value;
            browser.storage.local.set({
                [user.toString()]: item[user.toString()]
            })
        })
    }
}

class Profile {
    constructor(data) {
        this.data = data || {
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
    }
}

class StoreObject {
    constructor(type, database) {
        this.type = type;
        this.database = database;
    }

    async set(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readwrite");
            const objectStore = transaction.objectStore(this.type);

            const request = objectStore.add(value, key);

            transaction.oncomplete = () => {
                resolve(request.result);
            };

            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async delete(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readwrite");
            const objectStore = transaction.objectStore(this.type); 
            try{
            const request = objectStore.delete(key);

            request.onsuccess = resolve
            request.onerror = reject
            } catch(e){
                console.log("error deleting", key);
            }
        });
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readonly");
            const objectStore = transaction.objectStore(this.type);

            objectStore.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;

                if(cursor === undefined || cursor === null) { resolve(); return; };
                if(cursor.key !== key) { cursor.continue(); return; }
                
                resolve(cursor.value);
            };

            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async sort(sortFunction) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readonly");
            const objectStore = transaction.objectStore(this.type);
    
            const results = [];
    
            objectStore.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    results.sort(sortFunction);
                    resolve(results);
                }
            };
    
            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async filter(sortFunction) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readonly");
            const objectStore = transaction.objectStore(this.type);

            const results = [];

            objectStore.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if(sortFunction(cursor.value)) results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readonly");
            const objectStore = transaction.objectStore(this.type);

            const results = [];

            objectStore.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async forEach(callback) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(this.type, "readonly");
            const objectStore = transaction.objectStore(this.type);

            objectStore.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    callback(cursor.key, cursor.value);
                    cursor.continue();
                }
            };

            transaction.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
}

class StorageDB {
    constructor(name, version, callback, store_class,...stores) {
        this.stores = {};

        const request = indexedDB.open(name, version);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            for (const store of stores) {
                if (!database.objectStoreNames.contains(store)) {
                    database.createObjectStore(store, {
                        autoIncrement: true,
                    });
                }
            }
        };

        request.onsuccess = (event) => {
            this.database = event.target.result;

            for(const name of this.database.objectStoreNames) {
                this.stores[name] = new store_class(name, this.database);
            }

            callback();
        };

        request.onerror = (event) => {
            console.error("Error opening database:", event.target.error);
        };
    }
}

class ProfileStore extends StoreObject {
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

class ProfileDB extends StorageDB {
    constructor(callback) {
        super("profileDB", 8, callback, ProfileStore, "profile", "history", "watchlist");
    }
}

const profileDB = new ProfileDB(() => {
    // Convert old storage to new indexedDB storage
    storage.getUsers((info) => {
        if(info === undefined || info.others === undefined) return;
        for(let id of info.others) {
            storage.get(id, "profile", profile => {
                if(profile === undefined) return;
                if(profile.profile !== undefined) delete profile.profile;
                profileDB.stores.profile.get(id, "profile").then(_profile => {
                    if(_profile !== undefined) return;
                    profileDB.stores.profile.set(id, "profile", profile);

                    profileDB.stores.profile.set("meta", "current", id);
                    storage.currentUser = id;
                    storage.set(id, "profile", undefined);
                })
            })

            storage.get(id, "history", (history) => {
                if(history === undefined) return;
                profileDB.stores.history.get(id, "episodes").then((_history) => {
                    if(_history !== undefined) return;
                    profileDB.stores.history.set(id, "episodes", history);
                    storage.set(id, "history", undefined);
                })
            })

            storage.get(id, "watchlist", (watchlist) => {
                if(watchlist === undefined) return;
                profileDB.stores.watchlist.get(id, "watchlist").then(_watchlist => {
                    if(_watchlist !== undefined) return;
                    profileDB.stores.watchlist.set(id, "watchlist", watchlist);
                    storage.set(id, "watchlist", undefined);
                });
            })
        }

        profileDB.stores.profile.get("meta", "current").then(setCurrent);
        return
    })

    profileDB.stores.profile.get("meta", "current").then(setCurrent)
});

setCurrent = (id) => {
    if(storage.currentUser===id) return;
    
    console.log("Setting current profile id: " + id);
    storage.currentUser = id;
}