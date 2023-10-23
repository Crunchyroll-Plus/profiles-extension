import { crunchyroll } from "../../../api/scripts/crunchyroll.js";
import { locale } from "../../../api/scripts/locale.js";
import { storage } from "../../../api/scripts/storage.js";
import { request } from "../../../api/scripts/request.js";
import { config } from "../../../api/config/index.js";
import { tab } from "../../../api/scripts/tab.js";

const SETTINGS_PAGE = config.URLS.get("settings.all"); 
const AVATARS = config.URLS.get("settings.avatars");

request.override([AVATARS], "GET", async (info) => {
    var current = await storage.profile.get("meta", "current");

    if(current === undefined) return info.body;

    var history = await storage.history.get(current, "episodes");
    var watchlist = await storage.watchlist.get(current, "watchlist");

    var current_watchlist = await crunchyroll.content.getWatchlist({
        n: 2000
    });

    var current_history = await crunchyroll.content.getHistory({
        page_size: 2000
    });

    tab.exec({
        args: [
            history,
            watchlist,
            current_watchlist.result.data,
            current_history.result.data,
            {
                import_title: locale.messages.import_button,
                export_title: locale.messages.export_button,
                import_history: locale.messages.import_history_button,
                export_history: locale.messages.export_history_button,
                import_current_history: locale.messages.import_current_history,
                import_watchlist: locale.messages.import_watchlist_button,
                export_watchlist: locale.messages.export_watchlist_button,
                import_current_watchlist: locale.messages.import_current_watchlist,
            }
        ],
        func: (history, watchlist, current_watchlist, current_history, messages) => {
            waitForElm(".navigation-section").then((elm) => {
                if(elm.querySelector(".custom-section-title") !== null) return;

                var import_title = createTitle(messages.import_title);
                var export_title = createTitle(messages.export_title);
        
                elm.lastElementChild.after(import_title);
                import_title.after(export_title);
        
                var import_history = createButton(messages.import_history, () => selectJSON("import_history"));
        
                var export_history = createButton(messages.export_history, () => {
                    download(`history-${Date.now()}.json`, JSON.stringify(history, null, 4));
                })
        
                var import_current_history = createButton(messages.import_current_history, () => {
                    let history = {
                        items: []
                    }

                    history.items = current_history;

                    history.items.reverse();

                    browser.runtime.sendMessage({"type": "import_history", "value": history});
                });
        
                var import_watchlist = createButton(messages.import_watchlist, () => selectJSON("import_watchlist"));
        
                var export_watchlist = createButton(messages.export_watchlist, () => {
                    download(`watchlist-${Date.now()}.json`, JSON.stringify(watchlist, null, 4));
                })
        
                var import_current_watchlist = createButton(messages.import_current_watchlist, () => {
                    let watchlist = {
                        items: []
                    }

                    watchlist.items = current_watchlist;

                    browser.runtime.sendMessage({"type": "import_watchlist", "value": watchlist});
                });
        
                import_title.after(import_current_watchlist);
                import_title.after(import_current_history);
                import_title.after(import_watchlist);
                import_title.after(import_history);
        
                export_title.after(export_watchlist);
                export_title.after(export_history);
            })
            
            function createTitle(title) {
                var elm = document.createElement('h3');
            
                elm.classList.add("heading--nKNOf");
                elm.classList.add("heading--is-xxs--1CKSn");
                elm.classList.add("heading--is-family-type-one--GqBzU");
                elm.classList.add("section-title");
                elm.classList.add("custom-section-title");
            
                elm.innerText = title;
            
                return elm;
            }
            
            function selectJSON(type) {
                var finput = document.createElement("input");

                finput.setAttribute("type", "file");
                finput.setAttribute("accept", ".json");

                finput.click();

                finput.onchange = () => {
                    var reader = new FileReader();
                    reader.readAsText(finput.files[0], "UTF-8");
                    reader.onload = function(event) {
                        browser.runtime.sendMessage({"type": type, "value": JSON.parse(event.target.result)});
                    }
                };
            }
            
            function createButton(text, callback) {
                var select = document.createElement("div");

                select.setAttribute("role", "button");
                
                select.classList.add("add-button");
                select.classList.add("button--xqVd0");
                select.classList.add("button--is-type-one--3uIzT");
                select.classList.add("buttons-group__item--ThNEA");

                var span = document.createElement("span");

                span.classList.add("call-to-action--PEidl");
                span.classList.add("call-to-action--is-m--RVdkI");
                span.classList.add("button__cta--LOqDH")

                span.innerText = text
            
                select.addEventListener("click", callback);
            
                span.style.textAlign = "center";
                span.style.height = "auto";
                span.style.paddingTop = "10px";
                span.style.paddingBottom = "10px";

                select.style.mariginRight = "10px";

                select.appendChild(span);
            
                return select;
            }
            
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

            function download(filename, text) {
                var element = document.createElement('a');

                element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
                element.setAttribute('download', filename);
              
                element.style.display = 'none';

                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            }
    }}, SETTINGS_PAGE.replaceAll("*", ""));

    return info.body;
})

export default {
    loaded: true
}