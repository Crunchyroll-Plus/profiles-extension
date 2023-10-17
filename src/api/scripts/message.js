/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: API for controlling messages.
*/

export const messages = {
    send: (message, options) => {
        return new Promise((resolve, reject) => {
            return browser.runtime.sendMessage(message, options).then(resolve).catch(reject);
        })
    },
    trigger: (eventName, ...args) => {
        return new Promise((resolve, reject) => {
            return browser.runtime.sendMessage({
                eventName: eventName,
                args: [...args]
            }).then(resolve).catch(reject);
        });
    },
    addEvent: (name, callback) => {
        messages.events[name] = callback;
    },
    hasEvent: (name) => messages.events[name] !== undefined,
    removeEvent: (name) => delete messages.events[name],
    listener: browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log(message, sender, sendResponse);
    }),
    events: {}
}