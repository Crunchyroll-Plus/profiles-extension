import { storage } from "../../../api/scripts/storage.js";
import { locale } from "../../../api/scripts/locale.js";
import { tab } from "../../../api/scripts/tab.js";

const grid = document.querySelector(".grid");
const addBtn = document.querySelector(".add-button");
const removeBtn = document.querySelector(".remove-button");
const doneBtn = document.querySelector(".select-button");

let profile_elms = [];

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
        storage.profile.set("meta", "current", i);
        storage.current = i;

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
    if(storage.profile === undefined) return;
    storage.profile.forEach((key, data) => {
        addProfile(data.profile, key)
    });
    clearInterval(main_interval);
}, 500)

addBtn.addEventListener('click', (e) => {
    window.location.href = "https://www.crunchyroll.com/profile/activation"
});

doneBtn.addEventListener('click', (e) => {
    window.location.href = "https://www.crunchyroll.com/"
    tab.updateAll();
    tab.closePopup();
});

removeBtn.addEventListener('click', (e) => {
    storage.profile.delete(storage.current);
    storage.history.delete(storage.current);
    storage.watchlist.delete(storage.current);
    window.location.reload();
});