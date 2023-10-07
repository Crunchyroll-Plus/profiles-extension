request.override([URLS.assets.fms], "GET", async (info) => {
    var id = info.details.url.split("/").reverse()[0];
    var result = info.array;

    if(id.indexOf("_") > -1) {
        const seperated = id.split("_").reverse();
        const indentifier = seperated.pop();
        var file;
        var asset_url;

        switch(indentifier) {
            case "FS":
                file = seperated.reverse().join("_");
                asset_url = browser.extension.getURL(`src/assets/${file}`);
                break;
            case "G":
                const user = seperated.pop();
                const repo = seperated.pop().replaceAll(";", "/")
                const branch = seperated.pop();
                const other = seperated.pop();
                feed_root = seperated.pop().replaceAll(";", "/");
                file = seperated.reverse().join("_");

                if(feed_root.substring(1,1) === "/") feed_root = feed_root.substring(2, feed_root.length);

                asset_url = new URL([URLS.github, user, repo, branch, other, feed_root, "assets", file].join("/"))

                break;
        }

        response = await fetch(asset_url);

        return response.arrayBuffer()
    }

    // if(id.startsWith("FS_") === true) {
    //     id = id.split("FS_")[1];
    //     const url = browser.extension.getURL(`src/assets/${id}`)
    //     const response = await fetch(url);

    //     result = response.arrayBuffer();
    // }

    // if(id.startsWith("G_") === true) {
        
    // }

    return result;
})