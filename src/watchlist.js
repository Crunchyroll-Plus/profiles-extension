/*
 Saves the watchlist.
*/

request.override([URLS.watchlist.get], "GET", (info) => {
    return profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
      if(watchlist === undefined) return;
  
      watchlist.items.reverse();
  
      let ids = info.details.url.split("content_ids=")[1].split("&")[0].split("%2C");
  
      let result = new crunchyArray();
  
      for(let item of watchlist.items) {
        if(ids.indexOf(item.panel.id) === -1) continue;
  
        result.push({
            id: item.panel.id,
            is_favorite: item.is_favorite,
            last_modified: "2023-06-23T20:54:00Z"
        })
      }
 
      return result.stringify();
    })
  })

request.block([URLS.watchlist.save], "POST", (info) => {
    profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
        let toggle = false;
        if(watchlist === undefined) {
            tabExec('document.body.querySelector(".watchlist-toggle--LJPTQ").classList.add("watchlist-toggle--is-active--eu81r")')
            let watchlist = {items: []}

            crunchyroll.send({
                url: "https://www.crunchyroll.com/content/v2/discover/up_next/" + info.body.content_id +"?preferred_audio_language=ja-JP&locale="+getLocale(),
                method: "GET"
            }, (xml) => {
                let data = JSON.parse(xml.responseText).data[0];

                info.body.panel = data.panel;
                info.body.playhead = data.playhead;
                info.body.never_watched = data.never_watched;
                info.body.fully_watched = data.fully_watched
                info.body.is_favorite = false;

                watchlist.items.push(info.body)
                profileDB.stores.watchlist.set(storage.currentUser, "watchlist", watchlist);
            })

            return;
        }

        let count = 0;
        
        for(const item of watchlist.items) {
            if(item.panel.episode_metadata.series_id == info.body.content_id) {
                toggle = true;
                break;
            }
            count++;
        }

        if(toggle === true) {
            tabExec('document.body.querySelector(".watchlist-toggle--LJPTQ").classList.remove("watchlist-toggle--is-active--eu81r")')
            watchlist.items.pop(count);
        } else {
            tabExec('document.body.querySelector(".watchlist-toggle--LJPTQ").classList.add("watchlist-toggle--is-active--eu81r")')
            crunchyroll.send({
                url: "https://www.crunchyroll.com/content/v2/discover/up_next/" + info.body.content_id +"?preferred_audio_language=ja-JP&locale="+getLocale(),
                method: "GET"
            }, (xml) => {
                let data = JSON.parse(xml.responseText).data[0];

                info.body.panel = data.panel;
                info.body.playhead = data.playhead;
                info.body.never_watched = data.never_watched;
                info.body.fully_watched = data.fully_watched
                info.body.is_favorite = false;

                watchlist.items.push(info.body)
                profileDB.stores.watchlist.set(storage.currentUser, "watchlist", watchlist);
            })
        }
    })
})

request.block([URLS.watchlist.check_exist], ["GET", "DELETE"], (info) => {
    // Pretty much just need this to block.
})

request.override([URLS.watchlist.watchlist], "GET", async (info) => {
    let amount = parseInt(info.details.url.split("n=")[1].split("&")[0]);
    
    return profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
        let data = new crunchyArray();

        if(watchlist === undefined)
            return data.stringify();

        watchlist.items.reverse();


        for(let i = 0; i < watchlist.items.length; i++) {
            if(data.result.data.length >= amount) break;

            let item = watchlist.items[i];

            data.push({
                playhead: item.playhead,
                fully_watched: item.fully_watched,
                new: false,
                is_favorite: item.is_favorite,
                never_watched: item.never_watched,
                panel: item.panel
            })
        }

        return data.stringify();
    })
})

request.block([URLS.watchlist.set], ["DELETE", "PATCH"], (info) => {
    profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
        let id = info.details.url.split("?")[0].split("").reverse().join("").split("/")[0].split("").reverse().join("");

        if(info.details.method === "DELETE") {
            for(let i = 0; i < watchlist.items.length; i++) {
                if(watchlist.items[i].panel.episode_metadata.series_id === id) {
                    watchlist.items.splice(i, 1);
                    break;
                }
            }
        }

        if(info.details.method === "PATCH") {
            for(let i = 0; i < watchlist.items.length; i++) {
                if(watchlist.items[i].panel.episode_metadata.series_id == id) {
                    for(let key of Object.keys(info.body)){
                        watchlist.items[i][key] = info.body[key]
                    }
                    break;
                }
            }
        }

        profileDB.stores.watchlist.set(storage.currentUser, "watchlist", watchlist)

        tabExec("");
    })
})

request.override([URLS.watchlist.history], "GET", async (info) => {
    return profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
        let data = new crunchyArray();

        if(info.details.url.includes("check")) 
            return info.body;

        if(watchlist === undefined)
            return data.stringify();

        watchlist.items.reverse();

        for(let i = 0; i < watchlist.items.length; i++) {
            let item = watchlist.items[i];

            data.push({
                playhead: item.playhead,
                fully_watched: item.fully_watched,
                new: false,
                is_favorite: item.is_favorite,
                never_watched: item.never_watched,
                panel: item.panel
            })
        }
        
        return data.stringify();
    })
})
