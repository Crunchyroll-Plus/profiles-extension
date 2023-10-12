/*
    Edits the homefeed
*/

var used_titles = [];

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
        sort_items = sort_items || [];
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
        
        const feed = await github.home_feed.getFeed("hero_carousel");

        if(feed === undefined) return;

        const info = await github.getInfo();

        if(info.branch === undefined || info.repo === undefined) return;

        for(const hero of feed.heros) {

            for(const [key, value] of Object.entries(hero.images)) {
                hero.images[key] = `G_${info.user}_${info.repo.replaceAll("/", ";")}_${info.branch}_${info.other.replaceAll("/", ";")}_${feed.url}_${value}`;
            }

            if(hero.replace === true) item.items.splice(hero.position, 1, hero)
            else item.items.splice(hero.position, 0, hero);
        }
    },
    curated_collection: async (item) => {
        item.ids = await home_feed.sort("curated_collection", item.ids);
    },
    dynamic_collection: async (item) => {
        switch(item.response_type) {
            case "because_you_watched":
                if(item.position !== undefined || item.position !== null) break;

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

        // if(used_urls.indexOf(item.link) !== -1) return;
        // used_urls.push(item.link)

        // request.override(["https://www.crunchyroll.com" + item.link + "*"], "GET", async (info) => {
        //     let json = JSON.parse(info.body);

        //     json.data = await home_feed.sort(item.link, json.data)

        //     return JSON.stringify(json);
        // })
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
    storage.settings = await Settings.get("*");

    const data = new crunchyArray(info.body);

    const url = new URL(info.details.url);

    const start = parseInt(url.searchParams.get("start"));
    const size = parseInt(url.searchParams.get("n"));

    if(start === 0) {
        used_titles = [];

        profileDB.stores.history.get(storage.currentUser, "episodes").then(async history => {
            profile = await profileDB.stores.profile.get(storage.currentUser, "profile");
            storage.settings = await Settings.get("*");
    
            if(history !== undefined && history.items !== undefined && storage.settings.genreFeed === true) {
                history.items.reverse();

                const ids = [];
                home_feed.feed = []
                
                for(let item of history.items) {
                    if(item.panel === undefined) continue;
                    ids.push(item.panel.episode_metadata.series_id);
                }
    
                crunchyroll.content.getObjects(ids).then(objects => {
                    let vote = { };
    
                    for(const series of objects) {
                        for(let tag of series.series_metadata.tenant_categories || []) {
                            if(vote[tag] === undefined) vote[tag] = 0
                            vote[tag] += 1
                        }
                    }
    
                    let tags = [
                        []
                    ];
    
                    let caps = [
                        []
                    ];
    
    
                    for(const [tag, count] of shuffleArr(Object.entries(vote))) {
                        if(count >= 2) {
                            caps[caps.length - 1].push(tag)
                            tags[tags.length - 1].push(tag.toLowerCase())
                        }
    
                        if(tags[tags.length - 1].length === 2) {
                            tags.push([])
                            caps.push([])
                        };
                    }
    
                    let index = 0;
    
                    for(let tag of tags) {
                        if(tag.length === 0) continue;

                        let position = 8 + index;

                        const rng = getRandomInt(100)

                        if(rng % 2 === 0) {
                            home_feed.add_feed((11 + index).toString(), home_feed.create({
                                type: "dynamic_collection",
                                feed_type: "genre_recommendations",
                                response_type: "genre_recommendations",
                                title: "Popular: " + caps[index].join(", "),
                                description: "Based off of your watch history you may like these popular series.",
                                link: "/content/v2/discover/browse?categories=" + tag.join(",") + "&sort_by=popularity&n=20&locale=en-US",
                                position: position,
                                query_params: {
                                    n: 20
                                }
                            }))
                        } else {
                            home_feed.add_feed((11 + index).toString(), home_feed.create({
                                type: "dynamic_collection",
                                title: "Newly Added: " + caps[index].join(", "),
                                feed_type: "genre_recommendations",
                                response_type: "genre_recommendations",
                                description: "Based off of your watch history you may like these newly updated series.",
                                link: "/content/v2/discover/browse?categories=" + tag.join(",") + "&sort_by=newly_added&n=20&locale=en-US",
                                position: position,
                                query_params: {
                                    n: 20
                                }
                            }))
                        }
    
                        index++;
                    }
                })
             }
          })
    }

    const git_feeds = await github.home_feed.getFeeds()

    for(const feed of git_feeds) {
        if(feed.type === "hero_carousel") continue;
        feed.items.forEach((item) => {
            if(item.link !== undefined) item.link = item.link.replaceAll("{user_id}", crunchyroll.user.account_id).replaceAll("{text_locale}", profile.preferred_communication_language).replaceAll("{audio_locale}", profile.preferred_content_audio_language);

            if(item.panel !== undefined) {
                for(const [key, value] of Object.entries(item.panel.images)) {
                    item.panel.images[key] = `G_${info.user}_${info.repo.replaceAll("/", ";")}_${info.branch}_${info.other.replaceAll("/", ";")}_${feed.url}_${value}`;
                }
            }
            if(item.images !== undefined) {
                for(const [key, value] of Object.entries(item.images)) {
                    item.images[key] = `G_${info.user}_${info.repo.replaceAll("/", ";")}_${info.branch}_${info.other.replaceAll("/", ";")}_${feed.url}_${value}`;
                }
            }

            item.resource_type = feed.type

            home_feed.add_feed(item.id, item);
        })
    }

    let lists = await Settings.get("lists");
    
    if(lists !== undefined && lists.items !== undefined) {
        lists.items.forEach(list => {
            link = createLink(list)
            switch(list.list_type) {
                case "curated_collection":
                    home_feed.add_feed(list.id.toString(), home_feed.create({
                        type: list.list_type,
                        feed_type: "custom_list",
                        title: list.title,
                        response_type: "browse",
                        description: list.description || "",
                        position: list.position,
                        ids: list.ids 
                    }))
                    break;
                case "dynamic_collection":
                default:
                    home_feed.add_feed(list.id.toString(), home_feed.create({
                        type: "dynamic_collection",
                        feed_type: "custom_list",
                        title: list.title,
                        response_type: "browse",
                        description: "Your custom list!",
                        position: list.position,
                        link: link,
                        query_params: {
                            n: list.amount,
                            categories: list.genres.join(","),
                            type: list.type,
                            q: list.query
                        }
                    }))
                    break;
            }

        })
    }

    home_feed.feed.sort((item1, item2) => item1.position - item2.position)

    home_feed.feed.reverse();

    let index = 0;
    let remove = [];
    let count = 0;

    for(const feed of home_feed.feed) {
        switch(feed.feed_type) {
            case "genre_recommendations":
                if(storage.settings.genreFeed === true) break;
                index++;
                continue;
        }

        used_titles.push(feed.title);

        if(feed.feed_type === "custom_list" && lists.items !== undefined && lists.items.find(item => item.id === parseInt(feed.id.replace("dynamic_collection-", ""))) === undefined) {
            remove.push(index);
            continue
        }

        if(start <= feed.position + 1 && feed.position <= start + size) {
            const position = feed.position - start;
            
            if(feed.replace === true) {
                data.splice(position, 1, feed)
            } else {
                data.splice(position, 0, feed)
                count++;
            }
        }
        index++;
    }

    remove.forEach((index) => {
        home_feed.feed.splice(index, 1);
    })

    home_feed.feed.reverse()

    data.filter(item => item.position !== undefined || used_titles.indexOf(item.title) === -1)

    for(let item of data) {
        let callback = resource_callbacks[item.resource_type];

        if(callback === undefined) continue;

        await callback(item);
    }

    return data.toString();
})

const shuffleArr = arr => {
    const newArr = arr.slice()

    for (let i = newArr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
    }

    return newArr
};

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  