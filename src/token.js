/*
This script saves the token for later use in the crunchyroll API.
*/

request.override([URLS.token], "POST", (info) => {
  let data = JSON.parse(info.body);

  crunchyroll.token = data.access_token;
  browser.storage.local.set({access: crunchyroll.token});
  
  storage.getUsers((profiles) => {
    storage.get(profiles.current, "profile", (profile, item) => {
        if(profile === undefined) return;

        if(profile.profile)
            delete profile.profile;
        
        let user = item[profiles.current];

        let history = user.history;
        let watchlist = user.watchlist;

        patch.patches[1].script = "var profile = JSON.parse(atob(`" + btoa(JSON.stringify(profile || {}).replaceAll("`", "\\`")) + "`))\n" + importProfile;
        patch.patches[2].script = "var history = JSON.parse(atob(`" + btoa(JSON.stringify(history || {}).replaceAll("`", "\\`")) + "`))\n" + importHistory;
        patch.patches[3].script = "var watchlist = JSON.parse(atob(`" + btoa(JSON.stringify(watchlist || {}).replaceAll("`", "\\`")) + "`))\n" + importWatchlist;
    });
  });

  return JSON.stringify(data);
})