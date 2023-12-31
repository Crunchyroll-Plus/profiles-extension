import history from "./api/history.js";
import account from "./api/account.js";
import watchlist from "./api/watchlist.js";
import subtitles from "./api/subtitles.js";

console.log("Loaded %d history listeners", history.listeners.length);
console.log("Loaded %d account listeners", account.listeners.length);
console.log("Loaded %d watchlist listeners", watchlist.listeners.length);
console.log("Loaded %d subtitles listeners", subtitles.listeners.length);

export default {
    loaded: true
}