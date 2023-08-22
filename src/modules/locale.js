const locale = {
    get: () => chrome.i18n.getUILanguage(),
    getMessage: (key, def) => chrome.i18n.getMessage(key) || def,
}

// Legacy
const getLocale = () => chrome.i18n.getUILanguage();