const grid = document.querySelector(".grid");
const addBtn = document.querySelector(".add-button");
const removeBtn = document.querySelector(".remove-button");
const doneBtn = document.querySelector(".select-button");

let profile_elms = [];

const removeError = `
if(document.body.querySelector(".flash-message__wrapper--UWCF8"))
  document.body.querySelector(".flash-message__wrapper--UWCF8").remove();
`;

function tabExec(script) {
  browser.tabs.executeScript({
    code: removeError + script
  });
}

const add_text = document.querySelector('.add-btn-text');
const done_text = document.querySelector('.done-btn-text');
const remove_text = document.querySelector('.remove-btn-text');
const who_is_watching = document.querySelector('.browse-title');

add_text.innerText = locale.getMessage("add-button");
done_text.innerText = locale.getMessage("done-button");
remove_text.innerText = locale.getMessage("remove-button");
who_is_watching.innerText = locale.getMessage("who-is-watching");

function addProfile(profile, i) {
    if(profile === undefined) return;
    profile = profile || new crunchyProfile();
    let gitem = document.createElement('div');
    gitem.classList.add('g-item');

    let img = document.createElement('img');
    let span = document.createElement('span');

    img.classList.add('profile-avatar');
    img.classList.add('hover-item');
    span.classList.add('profile-name');

    img.src = "https://static.crunchyroll.com/assets/avatar/170x170/" + profile.avatar;
    span.innerText = profile.username.replace("_", " ");

    gitem.appendChild(img);
    gitem.appendChild(span);

    gitem.addEventListener('click', (e) => {
        storage.getUsers((profiles) => {
            profiles.current = i;

            if(profiles.others !== [] && profiles.others[i] === undefined) {
                 profiles.others.push(profiles.current);
                 storage.set(profiles.current, "profile", new crunchyProfile());
            }


            storage.currentUser = profiles.current;
            for(let profile of profile_elms) {
                if(profile.classList.contains('active')){
                    profile.classList.remove('active');
                    profile.classList.add('hover-item');
                }
            }
            img.classList.remove('hover-item');
            img.classList.add('active');
        })
    })

    grid.appendChild(gitem);

    profile_elms.push(img);
}

storage.getUsers((profiles) => {
    for(let idx of profiles.others) {
        storage.get(idx, "profile", (profile) => {
            addProfile(profile, idx);   
        })
    }
})

addBtn.addEventListener('click', (e) => {
    window.location.href = "https://www.crunchyroll.com/profile/activation"
});

doneBtn.addEventListener('click', (e) => {
    window.close();
});

removeBtn.addEventListener('click', (e) => {
    storage.getUsers((profiles) => {

        if(profiles.current < profiles.others.length - 1) {
            for(let i = profiles.current + 1; i < profiles.others.length; i++){
                storage.get(i, "history", (history) => {
                    console.log("MOVE HISTORY", i, i-1)
                    storage.set(i - 1, "history", history);
                    storage.set(i, "history", undefined);
                });

                storage.get(i, "watchlist", (watchlist) => {
                    console.log("MOVE WATCHLIST", i, i-1)
                    storage.set(i - 1, "watchlist", watchlist);
                    storage.set(i, "watchlist", undefined);
                });

                storage.get(i, "profile", (profile) => {
                    console.log("MOVE PROFILE", i, i-1)
                    storage.set(i - 1, "profile", profile);
                    storage.set(i, "profile", undefined);
                });

                profiles.others[i - 1] = i - 1;
            }
            profiles.others.pop(profiles.others.length - 1);
        } else
            profiles.others.pop(profiles.current);

        storage.set(profiles.current, "history", undefined)
        storage.set(profiles.current, "watchlist", undefined)
        storage.set(profiles.current, "profile", undefined)

        if(profiles.current === profiles.others.length)
            profiles.current--;
        else if(profiles.current > profiles.others.length)
            profiles.current = 0;
    });
    window.location.reload();
});