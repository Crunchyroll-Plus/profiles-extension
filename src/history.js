/*
  Prevents your history from being saved to any crunchyroll server,
  instead it saves it to your browser.
*/

const MIN_MINUTES_LEFT = 3; // Minimum amount of minutes left of a show.
const MAX_NEW_DAYS = 7; // Minimum amount of days before an episode is no longer new.

request.override([URLS.history.continue_watching], "GET", (info) => {
  let amount = parseInt(info.details.url.split("n=")[1].split("&")[0]);

  return profileDB.stores.history.get(storage.currentUser, "episodes").then((history) => {
    let data = new crunchyArray();

    if(history === undefined || history.items == undefined){
      return;
    }

    history.items.reverse()

    var found = []

    for(const hitem of history.items) {
      if(data.result.data.length >= amount) break;
      
      if(hitem.panel === undefined || hitem.playhead >= hitem.panel.episode_metadata.duration_ms / 1000)
        continue

      const episode_metadata = hitem.panel.episode_metadata;

      if(((episode_metadata.duration_ms / 1000) - hitem.playhead) / 60 < MIN_MINUTES_LEFT) {
        hitem.playhead = episode_metadata.duration_ms / 1000;
        continue;
      };

      if(found.indexOf(episode_metadata.series_id) !== -1)
        continue;

      found.push(episode_metadata.series_id)

      data.push({
        playhead: hitem.playhead,
        fully_watched: false, // Fully watched show get purged so this is going to always be false.
        new: false,
        panel: hitem.panel
      })
    }

    history.items.reverse();
    
    profileDB.stores.history.set(storage.currentUser, "episodes", history);
    
    return data.stringify();
  });
})

request.override([URLS.history.watch_history], "GET", (info) => {
  return profileDB.stores.history.get(storage.currentUser, "episodes").then(async history => {
    let data = new crunchyArray();

    let settings = await profileDB.stores.profile.get(storage.currentUser, "settings");

    settings = settings === undefined ? {
      genreFeed: true,
      compactHistory: false
    } : settings

    if(info.details.url.includes("check")) 
      return info.body;
    
    if(history === undefined || history.items === undefined){
      return data.stringify();
    }

    history.items.reverse();

    let used_series = [];

    for(const hitem of history.items) {

      if(hitem.panel === undefined || used_series.find(id => id === hitem.panel.episode_metadata.series_id) !== undefined) continue;

      if(settings.compactHistory === true) {
        used_series.push(hitem.panel.episode_metadata.series_id);
      }

      data.push({
        playhead: hitem.playhead,
        fully_watched: hitem.panel.episode_metadata.duration_ms / 1000 <= hitem.playhead,
        date_played: "2023-06-28T01:16:44Z",
        new: false,
        parent_id: hitem.panel.episode_metadata.duration_ms,
        parent_type: "series",
        id: hitem.panel.id,
        panel: hitem.panel
      })
    }

    tabExec("");

    return data.stringify();
  })
})

request.block([URLS.history.save_playhead], "POST", (info) => {
  profileDB.stores.history.get(storage.currentUser, "episodes").then((history) => {
    let postJS = info.body;

    if(history === undefined || history.items === undefined){
      history = {items: []};
    }

    let found = false;
    
    for(let i = 0; i < history.items.length; i++) {
      let item = history.items[i];

      if(item.panel === undefined || item.panel === null)
          break;
      
      if(item.panel.id == postJS.content_id) {
        history.items.splice(i, 1);

        postJS.panel = item.panel;

        history.items.push(postJS);

        profileDB.stores.history.set(storage.currentUser, "episodes", history);

        found = true;
      }
    }

    if(found === true) return; 


    crunchyroll.send({
      url: "https://www.crunchyroll.com/content/v2/cms/objects/" + postJS.content_id + "?ratings=true&locale="+getLocale(),
      method: "GET"
    }, (xml) => {
      postJS.panel = JSON.parse(xml.responseText).data[0];

      history.items.push(postJS);

      profileDB.stores.history.set(storage.currentUser, "episodes", history);

      profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
        if(watchlist === undefined) return;
        
        for(const item of watchlist.items) {
          if(item.panel === undefined) continue;
          if(item.panel.episode_metadata.series_id === postJS.panel.episode_metadata.series_id) {
            item.playhead = postJS.playhead;
            item.fully_watched = postJS.fully_watched;
            item.panel = postJS.panel;
            break;
          }
        }

        profileDB.stores.watchlist.set(storage.currentUser, "watchlist", watchlist);
      })
    })
  })
});

request.override([URLS.history.playheads], "GET", (info) => {
  return profileDB.stores.history.get(storage.currentUser, "episodes").then(history => {
    if(history === undefined) return;

    history.items.reverse();

    let ids = info.details.url.split("content_ids=")[1].split("&")[0].split("%2C");

    let result = new crunchyArray();

    for(const item of history.items) {
      if(item.panel === undefined || ids.indexOf(item.panel.id) === -1) continue;

      result.push({
          playhead: item.playhead | 0,
          content_id: item.panel.id,
          fully_watched: false,
          last_modified: "2023-06-23T20:54:00Z"
      })
    }

    return result.stringify();
  })
})

request.block([URLS.history.delete], "DELETE", (info) => {
  let id = info.details.url.split("watch-history")[1].split("?")[0].split("/")[1];
  
  return profileDB.stores.history.get(storage.currentUser, "episodes").then(history => {
    if(history === undefined) {
      return;
    }

    if(id === undefined)
      history.items = [];

    for(let i = 0; i < history.items.length; i++) {
      let item = history.items[i];
      if(item.panel === undefined) continue;
      if(item.panel.id == id) {
        history.items.splice(i, 1);
        break;
      }
    }

    profileDB.stores.history.set(storage.currentUser, "episodes", history);
    tabExec("");
  })
})