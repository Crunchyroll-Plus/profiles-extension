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

request.block([URLS.profile.get], "PATCH", (info) => {
  storage.get(storage.currentUser, "profile", (profile) => {
    let data = info.body;

    for(let key of Object.keys(data)){
      profile[key] = data[key];
    }

    storage.set(storage.currentUser, "profile", profile);
    tabExec("window.location.reload();");
  })
})

request.block([URLS.profile.new_profile], "PATCH", (info) => {
  // Overrides the profile activation page to work as a new profile button.
  tabExec(`
  let img = document.querySelector(".content-image__image--7tGlg").src.split("/170x170/")[1];

  let xml = new XMLHttpRequest();
  
  xml.open("GET", "https://www.crunchyroll.com/fake/message?message="+img+",${info.body.username}&type=0");

  xml.send();
  `)
})

request.override([URLS.profile.get], "GET", async (info) => {

  if(info.details.originUrl === URLS.profile.activation)
    return "";

  return storage.getUsers((profiles) => {    
    storage.currentUser = profiles.current

    return storage.get(storage.currentUser, "profile", (profile, item) => {
      browser.storage.local.set({original_profile: info.body});
        
      if(profile === undefined) {
        // TODO: Finish "Who is watching?" page.
        let profile_window = browser.windows.create({url: browser.extension.getURL("/src/pages/profile/profile.html")});

        var interval;

        profile_window.then((window) => {
          interval = setInterval(() => {
              browser.windows.get(window.id).catch(() => {
                clearInterval(interval);
                tabExec("window.location.reload();");
              });
          }, 500);
        });
      }
      
      return JSON.stringify(profile);
    })
  })
})
