import { storage } from "../../../api/scripts/storage.js";

const hexPattern = new RegExp(".{1,2}", "g");
const fromHex = (hex) => ((hex = hex.match(hexPattern)) === null ? [] : hex).map(code => parseInt(code, 16));
const toHex = (...colors) => [...colors].slice(0, 3).reduce((acc, item) => acc + item.toString(16), "")

const fonts = [
    'Arial',
    'Trebuchet MS',
    'Verdana',
    'Arial Black',
    'Bahnschrift',
    'Calibri',
    'Cambria',
    'Cambria Math',
    'Candara',
    'Comic Sans MS',
    'Consolas',
    'Constantia',
    'Corbel',
    'Courier New',
    'Ebrima',
    'Franklin Gothic Medium',
    'Gabriola',
    'Gadugi',
    'Georgia',
    'HoloLens MDL2 Assets',
    'Impact',
    'Ink Free',
    'Javanese Text',
    'Leelawadee UI',
    'Lucida Console',
    'Lucida Sans Unicode',
    'Malgun Gothic',
    'Marlett',
    'Microsoft Himalaya',
    'Microsoft JhengHei',
    'Microsoft New Tai Lue',
    'Microsoft PhagsPa',
    'Microsoft Sans Serif',
    'Microsoft Tai Le',
    'Microsoft YaHei',
    'Microsoft Yi Baiti',
    'MingLiU-ExtB',
    'Mongolian Baiti',
    'MS Gothic',
    'MV Boli',
    'Myanmar Text',
    'Nirmala UI',
    'Palatino Linotype',
    'Segoe MDL2 Assets',
    'Segoe Print',
    'Segoe Script',
    'Segoe UI',
    'Segoe UI Historic',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'SimSun',
    'Sitka',
    'Sylfaen',
    'Symbol',
    'Tahoma',
    'Times New Roman',
    'Webdings',
    'Wingdings',
    'Yu Gothic'
]

var settings = {
    fontname: "Trebuchet MS",
    fontsize: 20,
    primarycolour: [255, 255, 255, 0],
    secondarycolour: [255, 0, 0, 0],
    outlinecolour: [0,0,0,0],
    backcolour: [0,0,0,0],
    shadow: 1,
    outline: 2,
    spacing: 0,
    bold: 0,
    underline: 0,
    italic: 0,
}

var content = document.querySelector(".dropdown-content");
var button = document.querySelector("#dropdown-button");

const choose_callback = (chosen) => {
    button.innerText = chosen;
    settings.fontname = chosen;

    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
}

function addFont(font) {
    let elm = document.createElement("div")
    elm.innerText = font;
    elm.className = "dropdown-value";
    elm.style.fontFamily = font;
    elm.addEventListener("click", () => choose_callback(font));

    content.appendChild(elm);
} 

button.addEventListener("click", () => {
    content.classList.toggle("show");
});

window.onclick = (event) => {
    if(event.target === button) return;
    if(content.classList.contains("show")) content.classList.toggle("show");
}


fonts.forEach(addFont)

var pcolor = document.querySelector("#pcolor");
// var popacity = document.querySelector("#popacity");
var scolor = document.querySelector("#scolor");
// var sopacity = document.querySelector("#sopacity");
var ocolor = document.querySelector("#ocolor");
// var oopacity = document.querySelector("#oopacity");
var bcolor = document.querySelector("#bcolor");
// var bopacity = document.querySelector("#bopacity");
var shadow = document.querySelector("#shadow");
var outline = document.querySelector("#outline");
var spacing = document.querySelector("#spacing");
var bold = document.querySelector("#bold");
var italic = document.querySelector("#italic");
var fontSize = document.querySelector("#fontSize");
var underline = document.querySelector("#underline");

storage.onload = () => {
    storage.profile.get("meta", "current").then(async current => {
        let subtitles = await storage.profile.get(current, "subtitles");
        if(subtitles !== undefined) settings = subtitles;

        pcolor.value = "#" + toHex(...settings.primarycolour);
        // popacity.value = settings.primarycolour[3] / 255 * 100;
        
        scolor.value = "#" + toHex(...settings.secondarycolour);
        // sopacity.value = settings.secondarycolour[3] / 255 * 100;
        
        ocolor.value = "#" + toHex(...settings.outlinecolour);
        // oopacity.value = settings.outlinecolour[3] / 255 * 100;
        
        bcolor.value = "#" + toHex(...settings.backcolour);
        // bopacity.value = settings.backcolour[3] / 255 * 100;

        shadow.value = settings.shadow;
        outline.value = settings.outline;
        spacing.value = settings.spacing;
        fontSize.value = settings.fontsize;
        
        bold.value = Boolean(settings.bold);
        italic.value = Boolean(settings.italic);
        underline.value = Boolean(settings.underline);
        
        button.innerText = settings.fontname;
    })
}

const color_change = (event) => {
    var color = event.target;
    
    let old = settings[color.name];
    settings[color.name] = fromHex(color.value.substring(1, color.value.length));
    settings[color.name][3] = old[3];
    
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
}

const number_change = (event) => {
    var number = event.target;
    settings[number.name] = number.value;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
}

pcolor.addEventListener("change", color_change);
scolor.addEventListener("change", color_change);
ocolor.addEventListener("change", color_change);
bcolor.addEventListener("change", color_change);

shadow.addEventListener("change", number_change);
outline.addEventListener("change", number_change);
spacing.addEventListener("change", number_change);
fontSize.addEventListener("change", number_change);

outline.addEventListener("change", () => {
    settings.outline = outline.value;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
});

shadow.addEventListener("change", () => {
    settings.shadow = shadow.value;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
});

spacing.addEventListener("change", () => {
    settings.spacing = spacing.value;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
});

bold.addEventListener("change", () => {
    settings.bold = bold.value ? 1 : 0;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
});

italic.addEventListener("change", () => {
    settings.italic = bold.italic ? 1 : 0;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
});

underline.addEventListener("change", () => {
    settings.underline = underline.value ? 1 : 0;
    storage.profile.get("meta", "current").then(current => {
        storage.profile.set(current, "subtitles", settings);
    })
});

// const opacity_change = (event) => {
//     var opacity = event.target;
//     settings[opacity.name][3] = ~~(parseInt(opacity.value) / parseInt(opacity.max) * 255);
//     storage.profile.get("meta", "current").then(current => {
//         storage.profile.set(current, "subtitles", settings);
//     })
// }

// popacity.addEventListener("change", opacity_change);
// sopacity.addEventListener("change", opacity_change);
// oopacity.addEventListener("change", opacity_change);
// bopacity.addEventListener("change", opacity_change);