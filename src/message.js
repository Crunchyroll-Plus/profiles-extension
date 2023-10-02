/*
  Handles the message url traffic.
*/

request.block([URLS.message], "GET", (info) => {
    let messages = info.details.url.split("message=")[1].split("&")[0].split(",");
    let type = info.details.url.split("type=")[1].split("&")[0];
  
    type = parseInt(type);
  
    switch(type) {
      case 0:
        avatar = messages[0];
        username = messages[1];
  
        profile = new crunchyProfile();
  
        profile.avatar = avatar;
        profile.username = username;
        if(profile.profile)
          delete profile.profile;
        
        profileDB.stores.profile.getAll().then((values) => {
            var user = values.length === 0 ? values.length + 1 : values.length;
            profileDB.stores.profile.set(user, "profile", profile)
            profileDB.stores.profile.set("meta", "current", user)
            url = browser.extension.getURL("/src/pages/profile/profile.html")
            tabExec('window.location.href = "' + url + '"');
        });
        break;
      case 1:
        let msg = messages[0].replaceAll("$LERE", ",").replaceAll("%27", "'").replaceAll("%22", "\"").replaceAll("$LCASE", "}").replaceAll("%20", " ").replaceAll("$AND", "&")
        let js = JSON.parse(msg);

        switch(js.type){
          case 1:
            // Import profile.
            profileDB.stores.profile.set(storage.currentUser, "profile", js.value);
            tabExec('window.location.reload()');
            break;
          case 2:
            profileDB.stores.history.set(storage.currentUser, "episodes", js.value);
            tabExec('window.location.reload()');
            break;
          case 3:
            profileDB.stores.watchlist.set(storage.currentUser, "watchlist", js.value);
            tabExec('window.location.reload()');
            break;
        }
        break;
    }
  });