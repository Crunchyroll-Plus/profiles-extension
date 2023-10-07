/*
    This script saves the token for later use in the crunchyroll API and updates the buttons.
*/

request.override([URLS.token], "POST", async (info) => {
  let data = JSON.parse(info.body);

  crunchyroll.token = data.access_token;

  browser.storage.local.set({access: crunchyroll.token, refresh: data.refresh_token});

  let headers = [];

  byu_counter = 0

  profileDB.stores.profile.get(storage.currentUser, "profile").then(profile => {
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

request.overrideHeaders([URLS.token], "POST", (details) => {
    browser.storage.local.set({token_auth: details.requestHeaders.find(item => item.name === "Authorization").value})
})

function encodeJS(obj){
    return JSON.stringify(obj).replace(/\\/g,'\\\\').replace(/'/g,"\\'")
}