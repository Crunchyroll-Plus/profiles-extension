/*
This script saves the token for later use in the crunchyroll API.
*/

request.override([URLS.token], "POST", (info) => {
  let data = JSON.parse(info.body);

  crunchyroll.token = data.access_token;
  browser.storage.local.set({access: crunchyroll.token});

  return JSON.stringify(data);
})