import { locale } from "../../../api/scripts/locale.js";

const ul = document.querySelector('ul');

function createOption(name, callback) {
    var li = document.createElement('li');
    var a = document.createElement('a');

    li.className = 'option';

    a.innerText = name;
    li.addEventListener('click', callback);

    li.appendChild(a);

    ul.appendChild(li);
}

function main() {
    ul.innerHTML = "";

    document.body.style.width = "150px";
    document.body.style.height = "auto";

    createOption(locale.messages.profile_selection, () => browser.windows.create({url: browser.runtime.getURL("/src/ui/select_profile/index.html")}));

    createOption(locale.messages.settings_selection, () => {
        ul.innerHTML = "";

        createOption("Subtitles", () => browser.windows.create({url: browser.runtime.getURL("/src/ui/subtitles/index.html")}));
        createOption("⬅", main);
    });
}

main();