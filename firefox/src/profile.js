/*
This script handles profile changes.
*/

const OPEN_PAGE_COOLDOWN = 3; // Wait x amount of time before opening the profile page again.

const removeError = `
if(document.body.querySelector(".flash-message__wrapper--UWCF8"))
document.body.querySelector(".flash-message__wrapper--UWCF8").remove();
`;

function tabExec(script) {
  browser.tabs.executeScript({
    code: removeError + script
  });
}

request.block([URLS.profile.get], "PATCH", async (info) => {
  const data = info.body;

  profileDB.stores.profile.get(storage.currentUser, "profile").then(profile => {
    for(let key of Object.keys(data)){
      profile[key] = data[key];
    }

    profileDB.stores.profile.set(storage.currentUser, "profile", profile);
  })

  tab.updateAll();
})

request.block([URLS.profile.new_profile], "PATCH", async (info) => {
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
        
        tabExec(`
          window.location.href = "https://www.crunchyroll.com/profile/activation"
        `)

        return "";
      };

      if(profile !== undefined) base_browse = "/content/v2/discover/browse?locale=" + profile.preferred_communication_language + "&preferred_audio_language=" + profile.preferred_content_audio_language;

      return JSON.stringify(profile);
    })
  });
})

request.override([URLS.me], "GET", async (info) => {
  let user_data = JSON.parse(info.body);

  browser.storage.local.set({user_data: user_data})

  user_data.created = new Date(user_data.created);

  crunchyroll.user = user_data;

  return JSON.stringify(user_data);
})

request.override([URLS.benefits], "GET", async (info) => {
  let data = JSON.parse(info.body).items;

  data.forEach(item => {
    if(item.__class__ !== "benefit") return;


    if(item.benefit.indexOf(".") !== -1) {
      const name = item.benefit.split(".")[0].replace("cr_", "");
      var value = item.benefit.split(".")[1];

      try { value = parseInt(value); } catch { };

      crunchyroll.benefits[name] = value;
      return;
    }


    crunchyroll.benefits[item.benefit.replace("cr_", "")] = true;

    browser.storage.local.set({benefits: crunchyroll.benefits});
  });

  return info.body;
})

// request.override([URLS.locale], "GET", async (info) => {
//   crunchyroll.locale = JSON.parse(info.body);

//   return info.body;
// })
