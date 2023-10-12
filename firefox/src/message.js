/*
  Handles the message url traffic.
*/

request.block([URLS.message], "GET", async (info) => {
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
        
        profileDB.stores.profile.getAll().then(async (values) => {
            var user = values.length === 0 ? values.length + 1 : values.length;

            profileDB.stores.profile.set(user, "profile", profile);
            profileDB.stores.profile.set("meta", "current", user);

            tab.closePopup();
            tab.runScript('window.location.href = "https://www.crunchyroll.com"');
        });
        break;
      case 1:
        let msg = messages[0].replaceAll("$LERE", ",").replaceAll("$LCASE", "}").replaceAll("$AND", "&");
        let js = JSON.parse(msg);

        switch(js.type){
          case 1:
            // Import profile.
            profileDB.stores.profile.set(storage.currentUser, "profile", js.value);
            tab.updateAll();
            break;
          case 2:
            profileDB.stores.history.set(storage.currentUser, "episodes", js.value);
            tab.updateAll();
            break;
          case 3:
            profileDB.stores.watchlist.set(storage.currentUser, "watchlist", js.value);
            tab.updateAll();
            break;
        }
        break;
    }
  });