/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: API for getting locale messages.
*/

const i18n = browser.i18n;

let messages_temp = {};

const message_handler = {
    get(target, key, receiver) {
        key = key.replaceAll("_", "-")
        let result = locale_tmp.getMessage(key);
        return result !== key ? result : key.replaceAll("-", " ");
    }
}

let locale_tmp = {
    get: () => i18n.getUILanguage(),
    getMessage: (key, def) => i18n.getMessage(key) || def,
    messages: new Proxy(messages_temp, message_handler)
}

const locale_handler = {
    get(target, key, receiver) {
        if(key === "lang" || key === "language") return i18n.getUILanguage();
        if (key in target) return Reflect.get(target, key, receiver);
    }
}

export const locale = new Proxy(locale_tmp, locale_handler);

// Legacy
export const getLocale = () => i18n.getUILanguage();