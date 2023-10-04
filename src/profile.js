/*
This script handles profile changes.
*/

const OPEN_PAGE_COOLDOWN = 30; // Wait x amount of time before opening the profile page again.

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
  profileDB.stores.profile.get(storage.currentUser, "profile", (profile) => {
    let data = info.body;

    for(let key of Object.keys(data)){
      profile[key] = data[key];
    }

    profileDB.stores.profile.set(storage.currentUser, "profile", profile);
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

var last_open = 0;

request.override([URLS.profile.get], "GET", async (info) => {

  if(info.details.originUrl === URLS.profile.activation)
    return "";
  
  return profileDB.stores.profile.get("meta", "current").then(id => {
    storage.currentUser = id;
    return profileDB.stores.profile.get(id, "profile").then(profile => {
      browser.storage.local.set({original_profile: info.body});

      if(profile === undefined) {
        let profile_window = browser.windows.create({url: browser.extension.getURL("/src/pages/profile/profile.html")});

        var interval;

        profile_window.then((window) => {
          interval = setInterval(() => {
              if((new Date().getTime() / 1000) - last_open < OPEN_PAGE_COOLDOWN) return;
              
              last_open = new Date().getTime() / 1000;

              browser.windows.get(window.id).catch(() => {
                clearInterval(interval);
                tabExec("window.location.reload();");
              });
          }, 1000);
        });
      }
      

      base_browse = "/content/v2/discover/browse?locale=" + profile.preferred_communication_language + "&preferred_audio_language=" + profile.preferred_content_audio_language;
      
      return JSON.stringify(profile);
    })
  });
})

request.override([URLS.locale], "GET", (info) => {
  crunchyroll.locale = JSON.parse(info.body);

  return info.body;
})