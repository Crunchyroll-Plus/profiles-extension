/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 *
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */

var _appendBuffer = function(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

const request = {
    from: "https://www.crunchyroll.com",
    send: (request, callback, before) => {
        let xml = new XMLHttpRequest();

        xml.addEventListener("load", () => { callback(xml) });
        xml.open(request.method.toUpperCase(), request.url);

        if(before)
            before(xml);

        xml.send(request.body);
    },
    override: (urls, methods, callback, types) => {
        browser.webRequest.onBeforeRequest.addListener(
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
    },
    block: (urls, method, callback, checks) => {
        browser.webRequest.onBeforeRequest.addListener(
            (details) => {
                if(typeof(method) === "string" && details.method.toLowerCase() !== method.toLowerCase() || typeof(method) === "object" && method.indexOf(details.method) == -1)
                    return {}

                let filter = browser.webRequest.filterResponseData(details.requestId);

                callback({details: details, filter: filter, body: details.requestBody !== null && details.requestBody.raw !== null && JSON.parse(decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))))})
                
                let cancel = true;

                (checks || []).forEach((call) => {if(call() === false) cancel = false;})

                return {cancel: cancel}
            },
            {urls: urls},
            ["blocking", "requestBody"]
        )
    }
}