var current_profile = undefined
var isTyping = false;

document.body.querySelector(".username").onclick = () => {
    isTyping = true;
    document.body.querySelector(".username").innerText = "";
}

window.addEventListener("keydown", (event) => {
    if(!isTyping)
        return;
    
    if(event.code == "Backspace") {
        document.body.querySelector(".username").innerText = document.body.querySelector(".username").innerText.substring(0, document.body.querySelector(".username").innerText.length - 1);
        return
    }
    
    if(event.code === "Enter") {
        isTyping = false;
        storage.get(storage.currentUser, "profile", (profile => {
            profile.username = document.querySelector(".username").innerText;
            storage.set(storage.currentUser, "profile", profile)
        }))
        return;
    }

    if(event.key.length == 1)
        document.body.querySelector(".username").innerText += event.key;
})


function loadAvatar() {
    storage.getUsers((profiles) => {
        storage.currentUser = profiles.current;
        storage.get(profiles.current, "profile", (profile) => {
            document.body.querySelector(".avatar").src = profile !== undefined && "https://static.crunchyroll.com/assets/avatar/170x170/" + profile.avatar || "https://static.crunchyroll.com/assets/avatar/170x170/0001-cr-white-orange.png";
            document.body.querySelector(".username").innerText = profile !== undefined && profile.username || "Profile" + profiles.current.toString();
            document.body.querySelector(".wallpaper").src = profile !== undefined && profile.wallpaper !== undefined && "https://static.crunchyroll.com/assets/wallpaper/720x180/" + profile.wallpaper || "https://static.crunchyroll.com/assets/wallpaper/720x180/01-crunchyroll-generic-hime.png";
        })
    })
}

loadAvatar();

function removeAvatar() {
    storage.getUsers((profiles) => {
        console.log(profiles);

        storage.set(profiles.current, "history", undefined)
        storage.set(profiles.current, "watchlist", undefined)
        storage.set(profiles.current, "profile", undefined)

        if(profiles.current < profiles.others.length - 1) {
            for(let i = profiles.current + 1; i < profiles.others.length; i++){
                storage.get(i, "history", (history) => {
                    storage.set(i - 1, "history", history);
                    storage.set(i, "history", undefined);
                });

                storage.get(i, "watchlist", (watchlist) => {
                    storage.set(i - 1, "watchlist", watchlist);
                    storage.set(i, "watchlist", undefined);
                });

                storage.get(i, "profile", (profile) => {
                    storage.set(i - 1, "profile", profile);
                    storage.set(i, "profile", undefined);
                });

                profiles.others[i - 1] = i - 1;
            }
            profiles.others.pop(profiles.others.length - 1);
        } else
            profiles.others.pop(profiles.current);

        if(profiles.current === profiles.others.length)
            profiles.current--;
        else if(profiles.current > profiles.others.length)
            profiles.current = 0;

        loadAvatar();
    })
}

function addAvatar(){
    storage.getUsers((profiles) => {
        profiles.current++;

        let profile = new crunchyProfile();

        profile.username = "Profile " + profiles.current.toString();

        profiles.others[profiles.current.toString()] = profiles.current;
        storage.set(profiles.current, "profile", profile.profile);

        browser.storage.local.set({profiles: profiles})
        loadAvatar();
    })
}


document.body.querySelector(".left").addEventListener("click", () => {
    storage.getUsers((profiles) => {
        if(profiles.others.length > 1 & profiles.current - 1 >= 0) {
            profiles.current--;
            browser.storage.local.set({profiles: profiles})
            loadAvatar();
        }
    })
});
document.body.querySelector(".right").addEventListener("click", () => {
    storage.getUsers((profiles) => {
        if(profiles.others.length > 1 & profiles.current < profiles.others.length - 1) {
            profiles.current++;
            browser.storage.local.set({profiles: profiles})
            loadAvatar();
        }
    })
});


document.body.querySelector(".add").onclick = addAvatar;
document.body.querySelector(".remove").onclick = removeAvatar;