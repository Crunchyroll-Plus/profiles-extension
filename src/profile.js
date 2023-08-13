/*
This script handles profile changes.
*/

const removeError = `
if(document.body.querySelector(".flash-message__wrapper--UWCF8"))
  document.body.querySelector(".flash-message__wrapper--UWCF8").remove();
`;

function tabExec(script) {
  browser.tabs.executeScript({
    code: removeError + script
  });
}

request.block([URLS.profile], "PATCH", (info) => {
  storage.get(storage.currentUser, "profile", (profile) => {
    let data = info.body;

    for(let key of Object.keys(data)){
      profile[key] = data[key];
    }

    storage.set(storage.currentUser, "profile", profile);
    tabExec("window.location.reload();");
  })
})

request.override([URLS.profile], "GET", async (info) => {
  
  return storage.getUsers((profiles) => {
    // TODO: Finish "Who is watching?" page.
    // browser.windows.create({url: browser.extension.getURL("/src/page/profiles.html")});
    
    storage.currentUser = profiles.current

    return storage.get(storage.currentUser, "profile", (profile) => {

      if(profile === undefined) {
        let prof = JSON.parse(info.body);
        
        profile = new crunchyProfile();

        profile.username = prof.username;

        storage.set(storage.currentUser, "profile", profile);
      }

      // Save original profile so we can revert to it later.

      browser.storage.local.set({original_profile: info.body});
      
      return JSON.stringify(profile);
    })
  })
})
