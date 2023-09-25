/*
This script saves the token for later use in the crunchyroll API.
*/


request.override([URLS.token], "POST", (info) => {
  let data = JSON.parse(info.body);

  crunchyroll.token = data.access_token;
  browser.storage.local.set({access: crunchyroll.token});

  let dec_token = `var token="${crunchyroll.token}"\n`;

  profileDB.stores.profile.get(storage.currentUser, "profile").then(profile => {
    if(profile !== undefined) {
        delete profile.profile;
        patch.patches[1].script = dec_token + "var profile = JSON.parse(atob(`" + btoa(JSON.stringify(profile || {}).replaceAll("`", "\\`")) + "`))\n" + importProfile;
    }
    else profile = {}

    profileDB.stores.history.get(storage.currentUser, "episodes").then(history => {
        if(history !== undefined)
            patch.patches[2].script = dec_token + "var history = JSON.parse(atob(`" + btoa(JSON.stringify(history || {}).replaceAll("`", "\\`")) + "`))\n" + importHistory;
        else history = {}

        profileDB.stores.watchlist.get(storage.currentUser, "watchlist").then(watchlist => {
            if(watchlist !== undefined)
                patch.patches[3].script = dec_token + "var watchlist = JSON.parse(atob(`" + btoa(JSON.stringify(watchlist || {}).replaceAll("`", "\\`")) + "`))\n" + importWatchlist;
            else watchlist = {}
            
            patch.patches[4].script = dec_token + "var profile = JSON.parse(atob(`" + btoa(JSON.stringify(profile || {}).replaceAll("`", "\\`")) + "`))\nvar history = JSON.parse(atob(`" + btoa(JSON.stringify(history || {}).replaceAll("`", "\\`")) + "`))\nvar watchlist = JSON.parse(atob(`" + btoa(JSON.stringify(watchlist || {}).replaceAll("`", "\\`")) + "`))\n" + mainImportButtons
            patch.init();
        });
    });
  });

  return JSON.stringify(data);
})