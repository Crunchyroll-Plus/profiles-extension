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

                filter.ondata = (event) => {
                    body += (details.requestBody === null || details.requestBody.raw === undefined) && decoder.decode(event.data, {stream: true}) || decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes)));
                }

                filter.onstop = async () => {
                    let str = await callback({details: details, encoder: encoder, decoder: decoder, filter: filter, body: body});

                    filter.write(encoder.encode(str))
                    
                    filter.disconnect();
                }

                return {}
            },
            {urls: urls, types: types},
            ["blocking", "requestBody"]
        )
    },
    block: (urls, method, callback) => {
        browser.webRequest.onBeforeRequest.addListener(
            (details) => {
                if(typeof(method) === "string" && details.method.toLowerCase() !== method.toLowerCase() || typeof(method) === "object" && method.indexOf(details.method) == -1)
                    return {}
                let filter = browser.webRequest.filterResponseData(details.requestId);

                callback({details: details, filter: filter, body: details.requestBody !== null && details.requestBody.raw !== null && JSON.parse(decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))))})

                return {cancel: true}
            },
            {urls: urls},
            ["blocking", "requestBody"]
        )
    }
}