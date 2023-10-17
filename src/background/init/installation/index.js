browser.runtime.onInstalled.addListener(async (details) => {
    switch(details.reason) {
        case "install":
            browser.tabs.create({
                url: "https://www.crunchyroll.com/profile/activation",
                active: true
            })
    }
});

export default {
    loaded: true
}