const sendJson = `
function sendJson(object) {
    let xml = new XMLHttpRequest();

    xml.open("GET", "` + URLS.message.replace("*", "") + `?message=" + JSON.stringify(object).replaceAll(",", "$LERE").replaceAll("}", "$LCASE").replaceAll("&", "$AND") + "&type=1");

    xml.send();
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  
`

const waitFor = `
function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
`

const download = `
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
  
    document.body.removeChild(element);
  }
`

const importScript = `
function createButton(text, callback) {
    let select = document.createElement("div");

    select.innerHTML = \`<div role="button" tabindex="0" class="add-button button--xqVd0 button--is-type-one-weak--KLvCX buttons-group__item--ThNEA" data-t="cancel-avatar-btn">
    <span class="call-to-action--PEidl call-to-action--is-m--RVdkI button__cta--LOqDH">\` + text + \`</span>
</div>\`

    select.addEventListener("click", callback);

    return select;
}
`;

var importProfile = download + waitFor + sendJson + importScript + `

waitForElm(".erc-account-user-info").then(user_info => {
    importBtn = createButton("` + locale.getMessage("import-profile-button") + `", () => {
        var finput = document.createElement("input");

        finput.setAttribute("type", "file");
        finput.setAttribute("accept", ".json");

        finput.click();

        finput.onchange = () => {
            var reader = new FileReader();
            reader.readAsText(finput.files[0], "UTF-8");
            reader.onload = function (evt) {
                sendJson({"type": 1, "value": JSON.parse(evt.target.result)});
            }
        };
    });

    exportBtn = createButton("` + locale.getMessage("export-profile-button") + `", () => {
        download("profile_" + String(getRandomInt(90000)) + ".json", JSON.stringify(profile, null, 4));
    });

    user_info.after(importBtn);
    importBtn.after(exportBtn);
});
`;

var importHistory = waitFor + download + sendJson + importScript + `
var btnGroup = document.createElement("div");

btnGroup.classList.add("collection-header");
btnGroup.style.width = "auto";

importBtn = createButton("` + locale.getMessage("import-history-button") + `", () => {
    var finput = document.createElement("input");

    finput.setAttribute("type", "file");
    finput.setAttribute("accept", ".json");

    finput.click();

    finput.onchange = () => {
        var reader = new FileReader();
        reader.readAsText(finput.files[0], "UTF-8");
        reader.onload = function (evt) {
            sendJson({"type": 2, "value": JSON.parse(evt.target.result)});
        }
    };
});

importCurrent = createButton("` + locale.getMessage("import-current") + `", () => {
    let xml = new XMLHttpRequest();
    xml.open("GET", "https://www.crunchyroll.com/content/v2/906995a7-4493-5783-916b-2664b377510e/watch-history?page_size=2000&locale=` + getLocale() + `");
    xml.setRequestHeader("Authorization", "Bearer " + token);
    xml.addEventListener("load", () => {
        let history = {
            items: []
        }

        let js = JSON.parse(xml.response);

        js.data.forEach((item) => {
            history.items.push({
                content_id: item.content_id,
                playhead: item.playhead,
                panel: item.panel,
            })
        })
        
        history.items.reverse();

        sendJson({type: 2, value: history});
    });
    xml.send();
});

exportBtn = createButton("` + locale.getMessage("export-history-button") + `", () => {
    download("history_" + String(getRandomInt(90000)) + ".json", JSON.stringify(history, null, 4));
});

btnGroup.appendChild(importBtn);
importBtn.after(exportBtn);
importBtn.after(importCurrent);

waitForElm(".content-wrapper--MF5LS").then((elm) => {
    waitForElm(".erc-history-content").then((elm) => {
        waitForElm(".collection-header").then((elm) => {
            elm.before(btnGroup);
        });
    });
    waitForElm(".erc-empty-list-info-box").then((elm) => {
        waitForElm(".button").then((elm) => {
            if(window.location.href.includes("watchlist")) return;
            let eImportBtn = elm.cloneNode(true);
            let eCurrentBtn = elm.cloneNode(true);

            eImportBtn.querySelector("a").removeAttribute("href");
            eCurrentBtn.querySelector("a").removeAttribute("href");

            eImportBtn.querySelector("span").innerText = "` + locale.getMessage("import-button") + `";
            eCurrentBtn.querySelector("span").innerText = "` + locale.getMessage("import-current") + `";

            eImportBtn.addEventListener("click", () => {
                var finput = document.createElement("input");

                finput.setAttribute("type", "file");
                finput.setAttribute("accept", ".json");

                finput.click();

                finput.onchange = () => {
                    var reader = new FileReader();
                    reader.readAsText(finput.files[0], "UTF-8");
                    reader.onload = function (evt) {
                        sendJson({"type": 2, "value": JSON.parse(evt.target.result)});
                    }
                };
            });

            eCurrentBtn.addEventListener("click", () => {
                let xml = new XMLHttpRequest();
                xml.open("GET", "https://www.crunchyroll.com/content/v2/906995a7-4493-5783-916b-2664b377510e/watch-history?page_size=2000&locale=` + getLocale() + `&check=false");
                xml.setRequestHeader("Authorization", "Bearer " + token);
                xml.addEventListener("load", () => {
                    let history = {
                        items: []
                    }

                    let js = JSON.parse(xml.response);

                    js.data.forEach((item) => {
                        history.items.push({
                            content_id: item.content_id,
                            playhead: item.playhead,
                            panel: item.panel,
                        })
                    })
                    
                    history.items.reverse();

                    sendJson({type: 2, value: history});
                });
                xml.send();
            });

            elm.after(eImportBtn);
            elm.after(eCurrentBtn);
        });
    });
});

`;

var importWatchlist = waitFor + download + sendJson + importScript + `
btnGroup = document.createElement("div");

btnGroup.classList.add("watchlist-header");
btnGroup.style.width = "auto";

importBtn = createButton("` + locale.getMessage("import-watchlist-button") + `", () => {
    var finput = document.createElement("input");

    finput.setAttribute("type", "file");
    finput.setAttribute("accept", ".json");

    finput.click();

    finput.onchange = () => {
        var reader = new FileReader();
        reader.readAsText(finput.files[0], "UTF-8");
        reader.onload = function (evt) {
            sendJson({"type": 3, "value": JSON.parse(evt.target.result)});
        }
    };
});

importCurrent = createButton("Import Current", () => {
    let xml = new XMLHttpRequest();
    xml.open("GET", "https://www.crunchyroll.com/content/v2/discover/906995a7-4493-5783-916b-2664b377510e/watchlist?order=desc&n=1000&check=false&locale=` + getLocale() + `");
    xml.setRequestHeader("Authorization", "Bearer " + token);
    xml.addEventListener("load", () => {
        let watchlist = {
            items: []
        }

        let js = JSON.parse(xml.response);

        js.data.forEach((item) => {
            watchlist.items.push({
                content_id: item.content_id,
                playhead: item.playhead,
                fully_watched: item.fully_watched,
                is_favorite: item.is_favorite,
                never_watched: item.never_watched,
                panel: item.panel,
            })
        })
        
        watchlist.items.reverse();

        sendJson({type: 3, value: watchlist});
    });
    xml.send();
});

exportBtn = createButton("` + locale.getMessage("export-watchlist-button") + `", () => {
    download("watchlist_" + String(getRandomInt(90000)) + ".json", JSON.stringify(watchlist, null, 4));
});

btnGroup.appendChild(importBtn);
importBtn.after(exportBtn);
importBtn.after(importCurrent);

waitForElm(".watchlist-header").then((elm) => {
    elm.before(btnGroup);
});
waitForElm(".erc-empty-list-info-box").then((elm) => {
    waitForElm(".button").then((elm) => {
        if(window.location.href.includes("history")) return;
        let eImportBtn = elm.cloneNode(true);
        let eCurrentBtn = elm.cloneNode(true);

        eImportBtn.querySelector("a").removeAttribute("href");
        eCurrentBtn.querySelector("a").removeAttribute("href");

        eImportBtn.querySelector("span").innerText = "` + locale.getMessage("import-button") + `";
        eCurrentBtn.querySelector("span").innerText = "` + locale.getMessage("import-current") + `";

        eImportBtn.addEventListener("click", () => {
            var finput = document.createElement("input");

            finput.setAttribute("type", "file");
            finput.setAttribute("accept", ".json");

            finput.click();

            finput.onchange = () => {
                var reader = new FileReader();
                reader.readAsText(finput.files[0], "UTF-8");
                reader.onload = function (evt) {
                    sendJson({"type": 3, "value": JSON.parse(evt.target.result)});
                }
            };
        });

        eCurrentBtn.addEventListener("click", () => {
            let xml = new XMLHttpRequest();
            xml.open("GET", "https://www.crunchyroll.com/content/v2/discover/906995a7-4493-5783-916b-2664b377510e/watchlist?order=desc&n=1000&check=false&locale=` + getLocale() + `");
            xml.setRequestHeader("Authorization", "Bearer " + token);
            xml.addEventListener("load", () => {
                let watchlist = {
                    items: []
                }

                let js = JSON.parse(xml.response);

                js.data.forEach((item) => {
                    watchlist.items.push({
                        content_id: item.content_id,
                        playhead: item.playhead,
                        fully_watched: item.fully_watched,
                        is_favorite: item.is_favorite,
                        never_watched: item.never_watched,
                        panel: item.panel,
                    })
                })
                
                watchlist.items.reverse();

                sendJson({type: 3, value: watchlist});
            });
            xml.send();
        });

        elm.after(eImportBtn);
        elm.after(eCurrentBtn);
    });
});
`;


storage.getUsers((profiles) => {
    storage.get(profiles.current, "profile", (profile, item) => {
        if(profile === undefined) {
            patch.init();
            return;
        };
        if(profile.profile)
            delete profile.profile;
        
        let user = item[profiles.current];

        let history = user.history;
        let watchlist = user.watchlist;

        patch.patches[1].script = "var profile = JSON.parse(atob(`" + btoa(JSON.stringify(profile || {}).replaceAll("`", "\\`")) + "`))\n" + importProfile;
        patch.patches[2].script = "var history = JSON.parse(atob(`" + btoa(JSON.stringify(history || {}).replaceAll("`", "\\`")) + "`))\n" + importHistory;
        patch.patches[3].script = "var watchlist = JSON.parse(atob(`" + btoa(JSON.stringify(watchlist || {}).replaceAll("`", "\\`")) + "`))\n" + importWatchlist;

        patch.init();


    });
});

const patch = { 
    patches: [
        {
            url: URLS.profile.get,
            origin: URLS.profile.activation,
            return: "",
            script: waitFor + `            
            waitForElm("div[data-t='submit-btn']").then((elm) => {
                const title = document.querySelector(".page-title");
                const btn = elm.querySelector("span");

                title.innerText = "` + locale.getMessage("create-profile-title") + `";
                btn.innerText = "` + locale.getMessage("create-profile-button") + `";
            });
            `
        },
        {
            url: URLS.assets.avatar,
            origin: URLS.settings.prefences,
        },
        {
            url: URLS.history.watch_history,
            origin: ["https://www.crunchyroll.com/history", "https://www.crunchyroll.com/watchlist"]
        },
        {
            url: URLS.watchlist.history,
            origin: ["https://www.crunchyroll.com/history", "https://www.crunchyroll.com/watchlist"]
        }
    ],
    init: () => {
        patch.patches.forEach((patch) => {
            request.override([patch.url], "GET", (info) => {
                let result = info.array;

                if(typeof(patch.origin) === "string" && info.details.originUrl === patch.origin || patch.origin.includes(info.details.originUrl)) {
                    result = patch.return || result;

                    let script = `var token="` + crunchyroll.token + `"\n` +patch.script;

                    tabExec(script);
                }

                return result;
            });
        });
    }
}