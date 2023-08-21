const sendJson = `
function sendJson(object) {
    let xml = new XMLHttpRequest();

    xml.open("GET", "` + URLS.message.replace("*", "") + `?message=" + JSON.stringify(object).replaceAll(",", "$LERE").replaceAll("}", "$LCASE") + "&type=1");

    xml.send();
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
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
var importProfile = download + sendJson + importScript + `
const user_info = document.querySelector(".erc-account-user-info");

importBtn = createButton("Import Profile", () => {
    var finput = document.createElement("input");

    finput.setAttribute("type", "file");
    finput.setAttribute("accept", ".json");

    finput.click();

    finput.onchange = () => {
        var reader = new FileReader();
        reader.readAsText(finput.files[0], "UTF-8");
        reader.onload = function (evt) {
            console.log(evt.target.result);
            sendJson({"type": 1, "value": JSON.parse(evt.target.result)});
        }
    };
});

exportBtn = createButton("Export Profile", () => {
    download(profile.username + "_profile_" + String(getRandomInt(90000)) + ".json", JSON.stringify(profile, null, 4));
});

user_info.after(importBtn);
importBtn.after(exportBtn);
`;


storage.getUsers((profiles) => {
    storage.get(profiles.current, "profile", (profile) => {
        if(profile.profile)
            delete profile.profile;

        let js = JSON.stringify(profile);
        
        importProfile = "var profile = JSON.parse(\"" + js.replaceAll("\"","\\\"") + "\")\nconsole.log(profile)" + importProfile;
        patch.patches[1].script = importProfile;

        patch.init();
    });
});
const patch = { 
    patches: [
        {
            url: URLS.profile.get,
            origin: URLS.profile.activation,
            return: "",
            script: `
            const title = document.querySelector(".page-title");
            const btn = document.querySelectorAll(".button__cta--LOqDH")[1];
            
            title.innerText = "Create a new profile!";
            btn.innerText = "Create profile";
            `
        },
        {
            url: URLS.assets.avatar,
            origin: URLS.settings.prefences,
        }
    ],
    init: () => {
        patch.patches.forEach((patch) => {
            request.override([patch.url], "GET", (info) => {
                let result = info.array;
                
                if(info.details.originUrl === patch.origin) {
                    result = patch.return;
                    tabExec(patch.script)
                }

                return result;
            });
        });
    }
}