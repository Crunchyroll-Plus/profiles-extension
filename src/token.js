/*
    This script saves the token for later use in the crunchyroll API and updates the buttons.
*/

request.override([URLS.token], "POST", async (info) => {
  let data = JSON.parse(info.body);

  crunchyroll.token = data.access_token;

  browser.storage.local.set({access: crunchyroll.token});

  let headers = [];

  byu_counter = 0

  profileDB.stores.profile.get(storage.currentUser, "profile").then(async profile => {
    storage.settings = await profileDB.stores.profile.get(storage.currentUser, "settings");

    storage.settings = storage.settings === undefined ? {
        genreFeed: true
    } : storage.settings;

    if(profile !== undefined) {
        delete profile.profile;
        headers[0] = "var profile = JSON.parse('" + encodeJS(profile || {}) + "')\n";
        patch.patches[1].script = headers[0] + importProfile;
    }
    else profile = {}

    profileDB.stores.history.get(storage.currentUser, "episodes").then(history => {
        if(history !== undefined) {
            headers[1] = "var history = JSON.parse('" + encodeJS(history || {}) + "')\n";
            patch.patches[2].script = headers[1] + importHistory;
        }
        else history = {}
        
        if(history.items !== undefined && storage.settings.genreFeed === true) {
            history.items.reverse();
            let ids = []
            home_feed.feed = []

            for(let item of history.items) {
                ids.push(item.panel.episode_metadata.series_id);
            }

            crunchyroll.send({
                method: "GET",
                url: "https://www.crunchyroll.com/content/v2/cms/objects/" + ids.join(",") + "?ratings=true&preferred_audio_language=" + profile.preferred_content_audio_language + "&locale=" + profile.preferred_communication_language
            }, (xml) => {
                let vote = {

                }

                for(const series of JSON.parse(xml.response).data) {
                    for(let tag of series.series_metadata.tenant_categories) {
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

                let counter = 0;
                let index = 0;

                for(let tag of tags) {

                    let position = 5 + index;

                    home_feed.add_feed((11 + counter).toString(), home_feed.create({
                        type: "dynamic_collection",
                        feed_type: "genre_recommendations",
                        title: "Popular: " + caps[index].join(", "),
                        description: "Based off of your watch history you may like these popular series.",
                        link: "/content/v2/discover/browse?categories=" + tag.join(",") + "&sort_by=popularity&n=20&locale=en-US",
                        position: position,
                        query_params: {
                            n: 20
                        }
                    }))

                    counter++;

                    home_feed.add_feed((11 + counter).toString(), home_feed.create({
                        type: "dynamic_collection",
                        title: "Newly Added: " + caps[index].join(", "),
                        feed_type: "genre_recommendations",
                        description: "Based off of your watch history you may like these newly updated series.",
                        link: "/content/v2/discover/browse?categories=" + tag.join(",") + "&sort_by=newly_added&n=20&locale=en-US",
                        position: position,
                        query_params: {
                            n: 20
                        }
                    }))

                    index++;

                    counter++;
                }
            })
        }

        profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
            if(watchlist !== undefined) {
                headers[2] = "var watchlist = JSON.parse('" + encodeJS(watchlist || {}) + "')\n"
                patch.patches[3].script = headers[2] + importWatchlist;
            }
            else watchlist = {}
            
            patch.patches[4].script = headers.join(";") + mainImportButtons
            patch.init();
        });
    });
  });

  return JSON.stringify(data);
})

function encodeJS(obj){
    return JSON.stringify(obj).replace(/\\/g,'\\\\').replace(/'/g,"\\'")
}

const shuffleArr = arr => {
    const newArr = arr.slice()
    for (let i = newArr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
    }
    return newArr
};