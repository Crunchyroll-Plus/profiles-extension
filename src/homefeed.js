/*
    Edits the homefeed
*/


const home_feed = {
    create: (data) => {
        switch(data.type) {
            case "dynamic_collection":
                return {
                    title: data.title,
                    id: "dynamic_collection-1",
                    resource_type: data.type,
                    display_type: data.display_type === undefined ? "shelf" : data.display_type,
                    response_type: "recommendations",
                    description: data.description,
                    source_media_id: "",
                    source_media_title: "",
                    link: data.link,
                    query_params: data.query_params,
                    position: data.position,
                }
        }
    },
    feed: [],
    sort: async (sort_type, sort_items) => {
        switch(sort_type) {
            default:
                var sorted = [];
                var unsorted = [];

                if(sort_items.length !== undefined) {
                    for(let fitem of sort_items) {

                        let found = false;

                        if(fitem.type !== undefined && fitem.type === "top_news" || fitem.type === "latest_news" || sort_type.indexOf("watchlist") !== -1 || sort_type.indexOf("history") !== -1) continue;

                        let id = typeof(fitem) !== "object" && fitem || fitem.type !== undefined && ( fitem.type === "series" && fitem.id || fitem.type === "episode" && fitem.episode_metadata.series_id) || fitem.panel.id

                        try {
                            await profileDB.stores.history.get(storage.currentUser, "episodes").then(history => {
                                for(let hitem of history.items){
                                    if(id !== hitem.panel.episode_metadata.series_id) continue;
                                    found = true;
                                    sorted.push(fitem);
                                    break;
                                }
                            });
                        } catch (error) { };

                        if(found) continue;
            
                        try {
                            await profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
                                for(let witem of watchlist.items){
                                    if(id !== witem.content_id) continue;
                                    found = true;
                                    sorted.push(fitem);
                                    break;
                                }
                            });
                        }
                        catch(error) { };
            
                        if(found) continue;
            
                        unsorted.push(fitem)
                    }
                }
        
                sorted.reverse();
        
                return sorted.concat(unsorted);
        }
    }
}

home_feed.feed.push(
    home_feed.create({
        type: "dynamic_collection",
        title: "Continue Reading",
        description: "Continue reading where you left off on VIZ.",
        link: URLS.manga.short + "",
        position: 3,
        query_params: {
            n: 5
        }
    })
)

var byu_counter = 0;

const resource_callbacks = {
    hero_carousel: async (item) => {
        item.items = await home_feed.sort("hero_carousel", item.items)
    },
    curated_collection: async (item) => {
        item.ids = await home_feed.sort("curated_collection", item.ids)
    },
    dynamic_collection: async (item) => {
        request.override(["https://www.crunchyroll.com" + item.link + "*"], "GET", async (info) => {
            let json = JSON.parse(info.body);

            json.data = await home_feed.sort(item.link, json.data)

            return JSON.stringify(json);
        })

        if(item.response_type === "because_you_watched") {
            let replacement = await profileDB.stores.history.get(storage.currentUser, "episodes")
            replacement.items.reverse();
            replacement = replacement.items[byu_counter];
            
            if(replacement.panel.episode_metadata.series_title === item.source_media_title) return;

            item.title = item.title.replace(item.source_media_title, replacement.panel.episode_metadata.series_title);
            item.source_media_title = replacement.panel.episode_metadata.series_title;
            item.query_params.guid = replacement.panel.episode_metadata.series_id;
            item.link = item.link.replace(item.source_media_id, replacement.panel.episode_metadata.series_id)
            item.source_media_id = replacement.panel.episode_metadata.series_id;

            byu_counter++;
        }
    }
}

request.override([URLS.home_feed], "GET", async (info) => {
    let data = JSON.parse(info.body);

    for(let item of data.data) {
        let callback = resource_callbacks[item.resource_type];

        if(callback === undefined) continue;

        await callback(item);
    }

    return JSON.stringify(data);
})
