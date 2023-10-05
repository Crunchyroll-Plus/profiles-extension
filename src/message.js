/*
  Handles the message url traffic.
*/

function decodeURI(URI) {
  return URI.replaceAll(/\[\%\d+\]/g, )
}

request.block([URLS.message], "GET", (info) => {
    let url = new URL(info.details.url);

    let messages = url.searchParams.get("message").split(",");
    let type = url.searchParams.get("type");
  
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
        let msg = messages[0].replaceAll("$LERE", ",").replaceAll("$LCASE", "}").replaceAll("$AND", "&");
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