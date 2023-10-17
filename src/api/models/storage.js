/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: StorageDB made for creating an indexedDB database easier.
*/

export class StorageDB {
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
                if(this.stores[name] !== undefined) continue; 
                this.stores[name] = new store_class(name, this.database);
            }

            callback();
        };

        request.onerror = (event) => {
            console.error("Error opening database:", event.target.error);
        };
    }
}

export class StoreObject {
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