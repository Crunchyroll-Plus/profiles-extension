request.override([URLS.assets.fms], "GET", async (info) => {
    var id = info.details.url.split("/").reverse()[0];
    var result = info.array;

    if(id.startsWith("FS_")) {
        id = id.split("FS_")[1];
        const response = await fetch(browser.extension.getURL(`src/assets/${id}`));
        result = response.arrayBuffer();
    }

    return result;
})