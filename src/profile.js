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
    storage.currentUser = profiles.current

    return storage.get(storage.currentUser, "profile", (profile) => {
      browser.storage.local.set({original_profile: info.body});

      if(profile === undefined) {
        // TODO: Finish "Who is watching?" page.
        let profile_window = browser.windows.create({url: browser.extension.getURL("/src/pages/profile/profile.html")});
        var interval;

        profile_window.then((window) => {
          interval = setInterval(() => {
              browser.windows.get(window.id).catch((err) => {
                clearInterval(interval);
                tabExec("window.location.reload();");
              });
          }, 500)
        })
      }
      
      return JSON.stringify(profile);
    })
  })
})
