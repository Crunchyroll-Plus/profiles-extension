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

    select.children[0].style.textAlign = "center";
    select.children[0].style.height = "auto";
    select.children[0].style.paddingTop = "10px";
    select.children[0].style.paddingBottom = "10px";
    select.children[0].style.display = "inline-block";
    
    select.style.mariginRight = "10px";

    return select;
}
`;

var importProfile = download + waitFor + sendJson + importScript + `

waitForElm(".erc-account-user-info").then(user_info => {
    if(document.body.querySelector(".import-btn")) return;
    importBtn = createButton("` + locale.messages.import_profile_button + `", () => {
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

    importBtn.classList.add("import-btn");

    exportBtn = createButton("` + locale.messages.export_profile_button + `", () => {
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

importBtn = createButton("` + locale.messages.import_history_button + `", () => {
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

importCurrent = createButton("` + locale.messages.import_current + `", () => {
    let xml = new XMLHttpRequest();
    xml.open("GET", "https://www.crunchyroll.com/content/v2/906995a7-4493-5783-916b-2664b377510e/watch-history?page_size=1000&locale=` + locale.lang + `&check=true");
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

exportBtn = createButton("` + locale.messages.export_history_button + `", () => {
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

            eImportBtn.querySelector("span").innerText = "` + locale.messages.import_button + `";
            eCurrentBtn.querySelector("span").innerText = "` + locale.messages.import_current + `";

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
                xml.open("GET", "https://www.crunchyroll.com/content/v2/906995a7-4493-5783-916b-2664b377510e/watch-history?page_size=2000&locale=` + locale.lang + `&check=true");
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

importBtn = createButton("` + locale.messages.import_watchlist_button + `", () => {
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

importCurrent = createButton("` + locale.messages.import_current + `", () => {
    let xml = new XMLHttpRequest();
    xml.open("GET", "https://www.crunchyroll.com/content/v2/discover/906995a7-4493-5783-916b-2664b377510e/watchlist?order=desc&n=2000&locale=` + locale.lang + `&check=true");
    xml.setRequestHeader("Authorization", "Bearer " + token);
    xml.addEventListener("load", () => {
        let watchlist = {
            items: []
        }

        let js = JSON.parse(xml.response);

        js.data.forEach((item) => {
            watchlist.items.push({
                content_id: item.id,
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

exportBtn = createButton("` + locale.messages.export_watchlist_button + `", () => {
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

        eImportBtn.querySelector("span").innerText = "` + locale.messages.import_button + `";
        eCurrentBtn.querySelector("span").innerText = "` + locale.messages.import_current + `";

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
            xml.open("GET", "https://www.crunchyroll.com/content/v2/discover/906995a7-4493-5783-916b-2664b377510e/watchlist?order=desc&n=2000&locale=` + locale.lang + `&check=true");
            xml.setRequestHeader("Authorization", "Bearer " + token);
            xml.addEventListener("load", () => {
                let watchlist = {
                    items: []
                }

                let js = JSON.parse(xml.response);

                js.data.forEach((item) => {
                    watchlist.items.push({
                        content_id: item.id,
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

const mainImportButtons = waitFor + download + importScript + sendJson + `

waitForElm("a.erc-user-menu-nav-item[href='/account/preferences']").then((elm) => {
    waitForElm(":scope .nav-item-description > p").then((_) => {
        if(document.querySelector(".change-profile-button")) return;
        let clone = elm.cloneNode(true);
        elm.classList.add("change-profile-button");
        let name = clone.querySelector("h5");
        let description = clone.querySelector("p");

        clone.removeAttribute("href");

        clone.addEventListener("click", () => {
            window.location.href = "` + browser.extension.getURL("/src/pages/profile/profile.html") + `";
        });

        name.innerText = "Change Profile";

        description.innerText = "Manage your profiles.";

        elm.after(clone);
    });
});

widgetGroup = document.createElement("div");
widgetGroup.classList.add("widget-group");
widgetGroup.classList.add("content-wrapper--MF5LS");
widgetGroup.classList.add("carousel-scroller__track--43f0L");


importHistoryBtn = createButton("` + locale.messages.import_history_button + `", () => {
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

importCurrentHistory = createButton("` + locale.messages.import_current_history + `", () => {
    let xml = new XMLHttpRequest();
    xml.open("GET", "https://www.crunchyroll.com/content/v2/906995a7-4493-5783-916b-2664b377510e/watch-history?page_size=2000&locale=` + locale.lang + `&check=true");
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

importWatchlistBtn = createButton("` + locale.messages.import_watchlist_button + `", () => {
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

importCurrentWatchlist = createButton("` + locale.messages.import_current_watchlist + `", () => {
    let xml = new XMLHttpRequest();
    xml.open("GET", "https://www.crunchyroll.com/content/v2/discover/906995a7-4493-5783-916b-2664b377510e/watchlist?order=desc&n=1000&locale=` + locale.lang + `&check=true");
    xml.setRequestHeader("Authorization", "Bearer " + token);
    xml.addEventListener("load", () => {
        let watchlist = {
            items: []
        }

        let js = JSON.parse(xml.response);

        js.data.forEach((item) => {
            watchlist.items.push({
                content_id: item.id,
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

exportHistoryBtn = createButton("` + locale.messages.export_history_button + `", () => {
    download("history_" + String(getRandomInt(90000)) + ".json", JSON.stringify(history, null, 4));
});

exportWatchlistBtn = createButton("` + locale.messages.export_watchlist_button + `", () => {
    download("watchlist_" + String(getRandomInt(90000)) + ".json", JSON.stringify(watchlist, null, 4));
});

function createWidget(name, title, components) {
    if(widgetGroup.querySelector("." + name + "-group")) return;    
    let widget = document.createElement("div");

    widget.classList.add(name + "-group");

    widget.style.width = "auto";
    widget.style.padding = "10px 15px 15px 10px";
    widget.style.marginRight = "5px";
    widget.style.textAlign = "center";

    let text = document.createElement("span");

    text.innerText = title;

    text.classList.add("heading--nKNOf");
    text.classList.add("heading--is-m--7bv3g");
    text.classList.add("heading--is-family-type-two--U8YNl");
    text.classList.add("feed-header__title--DMRD6");

    text.style.paddingTop = "10px";
    text.style.paddingLeft = "20px";
    text.style.paddingRight = "20px";

    let divider = document.createElement("div");

    divider.classList.add("feed-divider--PvnEC");
    divider.classList.add("feed-divider--is-even--dCcSs");
    divider.classList.add("feed-header__divider--3SOtg");

    components[0].style.paddingTop = "10px";

    widget.appendChild(text);
    widget.appendChild(divider);

    for(let component of components) {
        widget.appendChild(component);
    }

    widgetGroup.appendChild(widget);
}

waitForElm(".dynamic-feed-wrapper").then((elm) => {
    if(document.querySelector(".widget-group")) return;
    
    createWidget("import", "` + locale.messages.import_button + `", [
        importHistoryBtn,
        importWatchlistBtn,
        importCurrentHistory,
        importCurrentWatchlist,
    ])

    createWidget("export", "` + locale.messages.export_button + `", [
        exportHistoryBtn,
        exportWatchlistBtn,
    ])

    elm.before(widgetGroup);
})
`;

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

                title.innerText = "` + locale.messages.create_profile_title + `";
                setTimeout(() => {
                    btn.innerText = "` + locale.messages.create_profile_button + `";
                }, 500);
            });
            `
        },
        {
            url: URLS.assets.avatar,
            origin: URLS.settings.prefences,
        },
        {
            url: URLS.history.watch_history,
            origin: ["https://www.crunchyroll.com/", "https://www.crunchyroll.com/watchlist", "https://www.crunchyroll.com/history", "https://www.crunchyroll.com/crunchylists"]
        },
        {
            url: URLS.watchlist.history,
            origin: ["https://www.crunchyroll.com/", "https://www.crunchyroll.com/watchlist", "https://www.crunchyroll.com/history", "https://www.crunchyroll.com/crunchylists"]
        },
        {
            url: ["https://www.crunchyroll.com/*", "https://eec.crunchyroll.com/*"],
            origin: ""
        }
    ],
    initiated: false,
    init: () => {
        if(patch.initiated === true) return;

        patch.initiated = true;

        console.log("init called for patch")

        patch.patches.forEach((patch) => {
            request.override(typeof(patch.url) === "string" ? [patch.url] : patch.url, "GET", (info) => {
                let result = info.array;
                
                if(info.details.originUrl !== undefined && info.details.originUrl.includes("moz-extension")) return result;

                if(typeof(patch.origin) === "string" && info.details.originUrl === patch.origin || patch.origin == "" || patch.origin.includes(info.details.originUrl)) {
                    result = patch.return || result;

                    let script = `var token="` + crunchyroll.token + `"\n` +patch.script;
                    
                    tabExec(script);
                }

                return result;
            });
        });
    }
}