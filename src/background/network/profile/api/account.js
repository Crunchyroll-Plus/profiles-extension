import { request } from "../../../../api/scripts/request.js";
import { crunchyroll } from "../../../../api/scripts/crunchyroll.js";
import { config } from "../../../../api/config/index.js";
import { storage } from "../../../../api/scripts/storage.js";
import { tab } from "../../../../api/scripts/tab.js";
import { locale } from "../../../../api/scripts/locale.js";

const NEW_PROFILE = config.URLS.get("profile.new_profile");
const ACTIVATION_PROFILE = config.URLS.get("profile.activation");
const GET_PROFILE = config.URLS.get("profile.get");
const ACCOUNT_INFO = config.URLS.get("me");
const BENEFITS = config.URLS.get("benefits");
const TOKEN = config.URLS.get("token");

export default {
    listeners: [
        request.block([NEW_PROFILE], "PATCH", (info) => {
            tab.exec({
                args: [ info.body.username ],
                func: (username) => {
                    let img = document.querySelector(".content-image__image--7tGlg").src.split("/170x170/")[1];
                    if(img === undefined) return;

                    if(window.location.href.endsWith("#install"))
                    browser.runtime.sendMessage({
                        type: "first_profile",
                        img: img,
                        username: username
                    });
                    else
                    browser.runtime.sendMessage({
                        type: "new_profile",
                        img: img,
                        username: username
                    });

                    window.location.href = "https://www.crunchyroll.com/"
                }
            })
            return true;
        }),
        request.block([GET_PROFILE], "PATCH", async (info) => {
            var current_id = await storage.profile.get("meta", "current");
            var profile = await storage.profile.get(current_id, "profile");

            if(profile === undefined) return true;

            for(const [key, value] of Object.entries(info.body)) {
                profile[key] = value;
            }

            storage.profile.set(current_id, "profile", profile);

            tab.updateAll();
        }),
        request.override([TOKEN], "POST", async (info) => {
            let data = JSON.parse(info.body);
            
            crunchyroll.token = data.access_token;
          
            browser.storage.local.set({access: crunchyroll.token});
          
            return info.body;
        }),
        request.override([GET_PROFILE], "GET", async (info) => {
            if(info.details.originUrl.includes("profile/activation")) {
                tab.exec({
                    args: [
                        JSON.parse(info.body),
                        {
                            title: locale.messages.create_profile_title,
                            button: locale.messages.create_profile_button,
                        }
                    ],
                    func: (profile, messages) => {
                        waitForElm("div[data-t='submit-btn']").then((elm) => {
                            let title = document.querySelector(".page-title");
                            let btn = elm.querySelector("span");
                            
                            title.innerText = messages.title;

                            if(window.location.href.endsWith("#install")) {
                                // console.log(profile);
                                let input = document.querySelector("input[name='username']");
                                let img = document.querySelector(".content-image__image--7tGlg")
                                input.parentElement.parentElement.classList.add("label--is-focus--pE9va");
                                input.value = profile.username;
                                img.src = "https://static.crunchyroll.com/assets/avatar/170x170/" + profile.avatar;

                                let parent = btn.parentElement;
                                parent.classList.remove("button--is-disabled--ndfHf");
                                parent.removeAttribute("style");
                                parent.setAttribute("aria-disabled", false);
                                parent.tabIndex = 0;
                                parent.classList.add("button--is-type-one--3uIzT");

                                parent.addEventListener("click", () => {
                                    if(parent.getAttribute("aria-disabled") === null) return;
                                    browser.runtime.sendMessage({
                                        type: "first_profile",
                                        img: img.src.split("170x170/")[1],
                                        username: input.value
                                    });
                                    setTimeout(() => window.location.href = "https://www.crunchyroll.com/", 500);
                                });
                            }

                            var interval = setInterval(() => {
                                if(btn.innerText === "") return;
                                clearInterval(interval);
                                btn.innerText = messages.button;
                            }, 100);
                        });
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
                    }
                })
                return "{}";
            }

            var current_id = await storage.profile.get("meta", "current");

            if(current_id === undefined) return info.body;

            var profile = await storage.profile.get(current_id, "profile");

            if(profile === undefined) {
                tab.exec({
                    func: () => {
                        if(window.location.href === "https://www.crunchyroll.com/") 
                            window.location.href = "https://www.crunchyroll.com/profile/activation"
                    }
                })

                return "";
            };

            return JSON.stringify(profile);
        }),
        request.override([ACCOUNT_INFO], "GET", async (info) => {
            let user_data = JSON.parse(info.body);
          
            browser.storage.local.set({user_data: user_data})

            user_data.created = new Date(user_data.created);
          
            crunchyroll.user = user_data;
          
            return JSON.stringify(user_data);
        }),
        request.override([BENEFITS], "GET", async (info) => {
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
    ]
}