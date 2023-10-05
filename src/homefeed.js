/*
    Edits the homefeed
*/


const home_feed = {
    responseTypes: [
        "recommendations",
        "history",
        "watchlist",
        "browse",
        "because_you_watched",
        "news_feed",
        "series",
        "artist",
        "music_video",
        "concert",
        "music_media_mixed",
        "recent_episodes"
    ],
    resourceTypes: [
        "panel",
        "continue_watching",
        "dynamic_collection",
        "curated_collection",
        "dynamic_watchlist",
        "music_videos_collection",
        "concerts_collection",
        "artists_collection",
        "artist",
        "music_video",
        "music_concert",
        "hero_carousel",
        "games_collection",
        "in_feed_banner"
    ],
    create: (data) => {
        switch(data.type) {
            case "dynamic_collection":
                return {
                    title: data.title,
                    resource_type: data.type,
                    display_type: data.display_type === undefined ? "shelf" : data.display_type,
                    response_type: data.response_type === undefined ? "recommendations" : data.response_type,
                    description: data.description,
                    source_media_id: "",
                    feed_type: data.feed_type,
                    source_media_title: "",
                    link: data.link,
                    query_params: data.query_params,
                    position: data.position,
                }
        }
    },
    add_feed: (id, data) => {
        data.id = data.resource_type + "-" + id;

        let index = -1;

        for(let i in home_feed.feed) {
            let item = home_feed.feed[i];
            if(item.id !== data.id) continue;
            index = i;
            break;
        }
        

        if( index > -1) { 
            home_feed.feed.splice(index, 1)
        };

        home_feed.feed.push(data);
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

                        let id = typeof(fitem) !== "object" && fitem || fitem.type !== undefined && ( fitem.type === "series" && fitem.id || fitem.type === "episode" && fitem.episode_metadata.series_id) || fitem.id

                        // try {
                        //     await profileDB.stores.history.get(storage.currentUser, "episodes").then(history => {
                        //         for(let hitem of history.items){
                        //             if(id !== hitem.panel.episode_metadata.series_id) continue;
                        //             found = true;
                        //             sorted.push(fitem);
                        //             break;
                        //         }
                        //     });
                        // } catch (error) { };

                        // if(found) continue;
            
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

var byu_counter = 0;

const used_urls = [];

const resource_callbacks = {
    hero_carousel: async (item) => {
        item.items = await home_feed.sort("hero_carousel", item.items)
    },
    curated_collection: async (item) => {
        item.ids = await home_feed.sort("curated_collection", item.ids)
    },
    dynamic_collection: async (item) => {
        switch(item.response_type) {
            case "because_you_watched":
                let replacement = await profileDB.stores.history.get(storage.currentUser, "episodes")
                if(replacement !== undefined && replacement.items !== undefined) {
                    replacement.items.reverse();
                    replacement = replacement.items[byu_counter];
                    if(replacement.panel !== undefined && replacement.panel.episode_metadata.series_title !== item.source_media_title) {
                        item.title = item.title.replace(item.source_media_title, replacement.panel.episode_metadata.series_title);
                        item.source_media_title = replacement.panel.episode_metadata.series_title;
                        item.query_params.guid = replacement.panel.episode_metadata.series_id;
                        item.link = item.link.replace(item.source_media_id, replacement.panel.episode_metadata.series_id)
                        item.source_media_id = replacement.panel.episode_metadata.series_id;

                        byu_counter++;
                    }
                }
        }

        if(used_urls.indexOf(item.link) !== -1) return;
        used_urls.push(item.link)

        request.override(["https://www.crunchyroll.com" + item.link + "*"], "GET", async (info) => {
            let json = JSON.parse(info.body);

            json.data = await home_feed.sort(item.link, json.data)

            return JSON.stringify(json);
        })
    }
}

var base_browse = "";

createLink = (list) => {
    var url = base_browse + "&n=" + list.amount + "&type=" + list.type;

    if(list.sort_type !== undefined)
        url += "&sort_by=" + list.sort_type;

    if(list.genres.length > 0)
        url += "&categories=" + list.genres.join(",");

    if(list.query !== undefined)
        url += "&q=" + list.query;

    return url;
}

request.override([URLS.home_feed], "GET", async (info) => {
    storage.settings = await profileDB.stores.profile.get(storage.currentUser, "settings");

    storage.settings = storage.settings === undefined ? {
        genreFeed: true
    } : storage.settings;

    let data = JSON.parse(info.body);

    let start = parseInt(info.details.url.split("start=")[1].split("&")[0]);
    let size = parseInt(info.details.url.split("n=")[1].split("&")[0]);

    let lists = await profileDB.stores.profile.get(storage.currentUser, "lists");
    
    if(lists !== undefined && lists.items !== undefined) {
        lists.items.forEach(list => {
            link = createLink(list)

            home_feed.add_feed(list.id.toString(), home_feed.create({
                type: "dynamic_collection",
                feed_type: "custom_list",
                title: list.title,
                response_type: list.type === "episode" ? "browse" : "custom_list",
                description: "Your custom list!",
                position: list.position,
                link: link,
                query_params: {
                    n: list.amount,
                }
            }))

        })
    }

    home_feed.feed.sort((item1, item2) => item1.position - item2.position)

    home_feed.feed.reverse()
    let index = 0;
    let remove = [];
    for(const feed of home_feed.feed) {

        switch(feed.feed_type) {
            case "genre_recommendations":
                if(storage.settings.genreFeed === true) break;
                index++;
                continue;
        }

        if(feed.feed_type === "custom_list" && lists.items !== undefined && lists.items.find(item => item.id === parseInt(feed.id.replace("dynamic_collection-", ""))) === undefined) {
            remove.push(index);
            index++;
            continue
        }

        if(start <= feed.position + 1 && feed.position <= start + size) data.data.splice(((feed.position - start) + 1), 0, feed)
        index++;
    }

    remove.forEach((index) => {
        home_feed.feed.splice(index, 1);
    })

    home_feed.feed.reverse()

    for(let item of data.data) {
        let callback = resource_callbacks[item.resource_type];

        if(callback === undefined) continue;

        await callback(item);
    }

    return JSON.stringify(data);
})