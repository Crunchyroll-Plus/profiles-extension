/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: This script is for collecting urls since some change frequently.
*/

import { locale } from "./locale.js";

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

export const collection = {
    css: new Collection("css"),
}

export const collection_types = {
    css: (_collection, callback) => {
        let xml = new XMLHttpRequest();
        xml.open("GET", "https://www.crunchyroll.com/");
        xml.send();

        xml.onload = () => {
            let text = xml.responseText;

            let rtlLinks = text.split("const rtlLinks = [")[1].split("]")[0];
            let ltrLinks = text.split("const ltrLinks = [")[1].split("]")[0]; 

            _collection.meta.isRTL = false

            if(locale.language.includes("ar")) {
                _collection.meta.isRTL = true
            }

            if(_collection.meta.isRTL)
                _collection.items = rtlLinks.replaceAll("\"", "").replaceAll("'", "").replaceAll("`", "").split(",");
            else
                _collection.items = ltrLinks.replaceAll("\"", "").replaceAll("'", "").replaceAll("`", "").split(",");

            callback(_collection.items);
        }
    }
}