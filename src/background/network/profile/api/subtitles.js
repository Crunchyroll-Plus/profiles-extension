import { request } from "../../../../api/scripts/request.js";
import { storage } from "../../../../api/scripts/storage.js";
import { config } from "../../../../api/config/index.js";

const SUBTITLES = config.URLS.get("subtitles");

const stylesPattern = new RegExp("\\[V([0-9])\\+ Styles\\]");
const colorPattern = new RegExp("(?:colour|color)");
const defaultNamePattern = new RegExp("(?:main|default)(?!(?:italic|bold|flashback|top|overlay|low))");
const hexPattern = new RegExp(".{1,2}", "g");

const convert = {
    agbr: (color) => {
        color = color.substring(2, color.length);
        let [alpha, green, blue, red] = ((color = color.match(hexPattern)) === null ? [] : color).map(code => parseInt(code, 16));
        return [red, green, blue, alpha];
    },
    rgba: (color) => {
        let tmp = Object.assign([], color);
        
        let red = tmp.splice(0, 1, tmp[3])[0];
        tmp.splice(3, 1, red);
        let green = tmp.splice(1, 1, tmp[2])[0];
        tmp.splice(2, 1, green);

        return tmp.reduce(
            (inc, code) => inc + ((code = code.toString(16)).length === 1 ? code + "0" : code),
            "&H"
        ).toUpperCase();
    }
}

export default {
    listeners: [
        request.override([SUBTITLES], "GET", async (info) => {
            let current = await storage.profile.get("meta", "current");
            let subtitles = await storage.profile.get(current, "subtitles");

            if(subtitles === undefined) return info.body;
            subtitles = Object.freeze(subtitles);

            let sections = info.body.split("\r\n\r\n");
            sections = sections.map(section => {
                if(!section.match(stylesPattern)) return section;
                let format = section.split("Format: ")[1].split("\r\n")[0].split(",");

                let nameIndex = format.indexOf("Name");
                let fontnameIndex = format.indexOf("Fontname");

                let lines = section.split("\r\n");
                let defaultSystem = lines[2];
                let defaultUpload = lines[3];
                let defaultValues = defaultUpload.split(",");

                defaultValues = (defaultValues[nameIndex].toLowerCase().match(defaultNamePattern) === null && defaultSystem[fontnameIndex] !== "Arial") ? defaultSystem.split(",") : defaultValues;
                if(defaultValues === undefined) defaultValues = defaultSystem; // Incase there is no uploadDefault and the default font is Arial.

                lines = lines.map(line => {
                    if(line.startsWith("[") || line.startsWith("Format: ")) return line;
                    let values = line.split(",");
                    
                    values = values.map((value, index) => {
                        let defaultValue = defaultValues[index];
                        let property = format[index].toLowerCase();


                        if(value === defaultValue && subtitles[property] !== undefined)
                            return property.match(colorPattern) === null ? subtitles[property] : convert.rgba(subtitles[property]);                        

                        return value;
                    })

                    return values.join(",");
                });

                section = lines.join("\r\n");
                return section;
            })
            
            return sections.join("\r\n\r\n");
        })
    ]
}