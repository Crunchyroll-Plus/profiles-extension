/*
 * @Name: browse.js
 * @Description: Changes the way crunchyroll's browse url works.
 * @Author: chonker
 * @Date: 2023-10-08
 * @Last Modified by: chonker
 * @Last Modified time: 2023-10-10
*/

request.override([URLS.browse], "GET", async (info) => {
  /* Query setup */
  const url = new URL(info.details.url);
  const query = new BrowseQuery(url.searchParams);

  /* Settings setup */
  var settings = await Settings.get("*");

  /* Misc. variables */
  var reversed = false;

  /* Misc. Checks */
  var reversed_check = () =>  { if(!reversed) (data.reverse() && (reversed = true)) };

  /* Data setup */
  var data = new crunchyArray(info.body);

  /* Query flags */
  const type = query.get("type");
  const sort_by = query.get("sort_by");
  const filter = query.get("filter");

  /* Query checks */
  newly_added = check(sort_by, "newly_added")

  /* Sort new episodes */
  if(newly_added && type === "episode") {
    if(settings.newDubs === true) data.filter((item) => item.episode_metadata.is_dubbed === false);
  
    if(settings.onlyNewWatched === true) {
      await data.sortBy("watched");
      // reversed_check();
    }
  }

  /* Filter episodes */
  if(filter !== null) {
    for(var name of filter.split(",")) {
      await data.sortBy(name);
    }
    // reversed_check();
  }

  return data.toString();
});


class BrowseQuery extends URLSearchParams {
  constructor(...args) {
    super(...args);
  }

  queryCheck(key, callback, ...args){
    const value = this.get(key);

    if(value !== null) callback.apply(this, value, ...args);
  }

  async runFilters(...args){
    for(const [name, value] of this.entries()) {
      const callback = browse_filters[name];

      if(callback === undefined) continue;
      await callback(this, value, ...args);
    }
  }
  check(key, value){
    const original = this.get(key);

    if(typeof original === "string" && typeof value === "string") return original.split(",").find(item => item.toLowerCase() === value.toLowerCase()) !== undefined;

    return original === value;
  }
}

function check(original, value) {
  if(typeof original === "string" && typeof value === "string") return original.split(",").find(item => item.toLowerCase() === value.toLowerCase()) !== undefined;
  return original === value;
}
  