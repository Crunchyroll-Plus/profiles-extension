/* 
    This script is for collecting urls since they change frequently.
*/

const collection_types = {
    css: (collection, callback) => {
        let xml = new XMLHttpRequest();
        xml.open("GET", "https://www.crunchyroll.com/");
        xml.send();

        xml.onload = () => {
            let text = xml.responseText;

            let rtlLinks = text.split("const rtlLinks = [")[1].split("]")[0];
            let ltrLinks = text.split("const ltrLinks = [")[1].split("]")[0]; 

            collection.meta.isRTL = false

            if(locale.language.includes("ar")) {
                collection.meta.isRTL = true
            }

            if(collection.meta.isRTL)
                collection.items = rtlLinks.replaceAll("\"", "").replaceAll("'", "").replaceAll("`", "").split(",");
            else
                collection.items = ltrLinks.replaceAll("\"", "").replaceAll("'", "").replaceAll("`", "").split(",");

            callback(collection.items);
        }
    }
}

class Collection {
    constructor(type) {
        this.items = [];
        this.meta = {};
        this.type = type;

        this.update = (callback) => {
            return collection_types[this.type](this, callback);
        }
    }
}

var collection = {
    css: new Collection("css"),
}