const grid = document.querySelector(".grid");
const addBtn = document.querySelector(".add-button");
const removeBtn = document.querySelector(".remove-button");
const doneBtn = document.querySelector(".select-button");

let profile_elms = [];

const removeError = `
if(document.body.querySelector(".flash-message__wrapper--UWCF8"))
  document.body.querySelector(".flash-message__wrapper--UWCF8").remove();
`;

const add_text = document.querySelector('.add-btn-text');
const done_text = document.querySelector('.done-btn-text');
const remove_text = document.querySelector('.remove-btn-text');
const who_is_watching = document.querySelector('.browse-title');

add_text.innerText = locale.messages.add_button;
done_text.innerText = locale.messages.done_button;
remove_text.innerText = locale.messages.remove_button;
who_is_watching.innerText = locale.messages.who_is_watching;

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
        profileDB.stores.profile.set("meta", "current", i);
        storage.currentUser = i;

        for(let profile of profile_elms) {
            if(profile.classList.contains('active')){
                profile.classList.remove('active');
                profile.classList.add('hover-item');
            }
        }

        img.classList.remove('hover-item');
        img.classList.add('active');
    })

    grid.appendChild(gitem);

    profile_elms.push(img);
}

var main_interval;

main_interval = setInterval(() => {
    if(profileDB.stores.profile === undefined) return;
    profileDB.stores.profile.forEach((key, data) => {
        addProfile(data.profile, key)
    });
    clearInterval(main_interval);
}, 500)

addBtn.addEventListener('click', (e) => {
    window.location.href = "https://www.crunchyroll.com/profile/activation"
});

doneBtn.addEventListener('click', (e) => {
    browser.tabs.getCurrent().then((tab) => {
        if(tab.index === 0)
            window.close();
        window.location.href = "https://www.crunchyroll.com/";
    })
});

removeBtn.addEventListener('click', (e) => {
    profileDB.stores.profile.delete(storage.currentUser);
    profileDB.stores.history.delete(storage.currentUser);
    profileDB.stores.watchlist.delete(storage.currentUser);
    window.location.reload();
});