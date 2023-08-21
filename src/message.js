/*
  Handles the message url traffic.
*/

request.block([URLS.message], "GET", (info) => {
    let messages = info.details.url.split("message=")[1].split("&")[0].split(",");
    let type = info.details.url.split("type=")[1].split("&")[0];
  
    type = parseInt(type);
  
    switch(type) {
      case 0:
        avatar = messages[0];
        username = messages[1];
  
        profile = new crunchyProfile();
  
        profile.avatar = avatar;
        profile.username = username;
  
        storage.getUsers((profiles) => {
          let count = 0;
  
          for(let i of profiles.others) {
            count++;
          }
  
          profiles.current = count;
          profiles.others.push(count);
  
          storage.set(count, "profile", profile);
          url = browser.extension.getURL("/src/pages/profile/profile.html")
          tabExec('window.location.href = "' + url + '"');
        })
        break;
      case 1:
        let msg = messages[0].replaceAll("$LERE", ",").replaceAll("%22", "\"").replaceAll("$LCASE", "}").replaceAll("%20", " ").replaceAll("$AND", "&")
        console.log(msg);
        let js = JSON.parse(msg);

        switch(js.type){
          case 1:
            // Import profile.
            storage.set(storage.currentUser, "profile", js.value);
            tabExec('window.location.reload()');
            break;
          case 2:
            storage.set(storage.currentUser, "history", js.value);
            tabExec('window.location.reload()');
            break;
          case 3:
            storage.set(storage.currentUser, "watchlist", js.value);
            tabExec('window.location.reload()');
            break;
        }
        break;
    }
  });