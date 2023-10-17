/*
    @author: chonker
    @version: 0.0.1
    @license: MPL 2.0
    @description: API for controlling network traffic and sending requests.
*/

export const request = {
    from: "https://www.crunchyroll.com",
    send: (request, callback, before) => {
        let xml = new XMLHttpRequest();

        xml.addEventListener("loadend", () => { callback(xml) });
        xml.open(request.method.toUpperCase(), request.url);

        if(before)
            before(xml);

        xml.withCredentials = true;

        xml.send(request.body);
    },
    getURLParams: (info) => {
        return new URLSearchParams(info.details.url.split("?")[1]);
    },
    overrideHeaders: (urls, methods, callback) => {
        return { 
            stop: () => {
                if(browser.webRequest.onBeforeSendHeaders.hasListener(this.listener))
                    browser.webRequest.onBeforeSendHeaders.removeListener(this.listener)
            },
            listener: browser.webRequest.onBeforeSendHeaders.addListener(
                (details) => {
                    if(details.documentUrl && details.documentUrl.includes(request.from) === false && details.originUrl && details.originUrl.includes(request.from) === false && details.frameId && details.frameId === 0)
                        return { requestHeaders: details.requestHeaders };

                    if(typeof(methods) === "string" && details.method.toLowerCase() !== methods.toLowerCase() || typeof(methods) === "object" && methods.indexOf(details.method) == -1)
                        return { requestHeaders: details.requestHeaders };

                    callback(details);
                    
                    return {
                        requestHeaders: details.requestHeaders
                    } 
                },
                { urls: urls },
                ["blocking", "requestHeaders"]
            )
        }
    },
    override: (urls, methods, callback, types) => {
        return {
            stop: () => {
                if(browser.webRequest.onBeforeRequest.hasListener(this.listener))
                    browser.webRequest.onBeforeRequest.removeListener(this.listener);
            },
            listener: browser.webRequest.onBeforeRequest.addListener(
                (details) => {
                    if(details.documentUrl && details.documentUrl.includes(request.from) === false && details.originUrl && details.originUrl.includes(request.from) === false && details.frameId && details.frameId === 0)
                        return {};

                    if(typeof(methods) === "string" && details.method.toLowerCase() !== methods.toLowerCase() || typeof(methods) === "object" && methods.indexOf(details.method) == -1)
                        return {};
                    
                    let filter = browser.webRequest.filterResponseData(details.requestId);
                    let decoder = new TextDecoder();
                    let encoder = new TextEncoder();
                    let body = "";
                    let array = new Uint8Array();

                    filter.ondata = (event) => {
                        array = _appendBuffer(array, event.data);
                        body += (details.requestBody === null || details.requestBody.raw === undefined) && decoder.decode(event.data, {stream: true}) || details.requestBody && decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))) || ""; 
                    }
                    

                    filter.onstop = async () => {
                        let str = await callback({details: details, array: array, encoder: encoder, decoder: decoder, filter: filter, body: body});
                        
                        filter.write(typeof(str) === "string" && encoder.encode(str) ||  new Uint8Array(str));
                        
                        filter.disconnect();
                    }

                    return {}
                },
                {urls: urls, types: types},
                ["blocking", "requestBody"]
            )
        }
    },
    block: (urls, method, callback, checks) => {
        return {
            stop: () => {
                if(browser.webRequest.onBeforeRequest.hasListener(this.listener))
                    browser.webRequest.onBeforeRequest.removeListener(this.listener)
            },
            listener: browser.webRequest.onBeforeRequest.addListener(
                (details) => {
                    if(typeof(method) === "string" && details.method.toLowerCase() !== method.toLowerCase() || typeof(method) === "object" && method.indexOf(details.method) == -1)
                        return {}

                    let decoder = new TextDecoder();
                    let filter = browser.webRequest.filterResponseData(details.requestId);
                    
                    let cancel = callback({
                        details: details,
                        filter: filter,
                        body: details.requestBody !== null &&
                        details.requestBody.raw !== null &&
                        JSON.parse(decoder.decode(details.requestBody.raw[0].bytes))
                    }) === false ? false : true;

                    return {cancel: cancel}
                },
                {urls: urls},
                ["blocking", "requestBody"]
            )
        }
    }
}

var _appendBuffer = function(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};