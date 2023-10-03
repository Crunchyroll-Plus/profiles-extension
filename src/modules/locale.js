const i18n = chrome.i18n;

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

const locale = new Proxy(locale_tmp, locale_handler);

// Legacy
const getLocale = () => i18n.getUILanguage();