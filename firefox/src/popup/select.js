const removeError = `
if(document.body.querySelector(".flash-message__wrapper--UWCF8"))
  document.body.querySelector(".flash-message__wrapper--UWCF8").remove();
`;
function tabExec(script) {
  browser.tabs.executeScript({
    code: removeError + script
  });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const ul = document.querySelector('ul');

function createOption(name, callback) {
    var li = document.createElement('li');
    var a = document.createElement('a');

    li.className = 'option';

    a.innerText = name;
    li.addEventListener('click', callback);

    li.appendChild(a);

    ul.appendChild(li);
}

function createTextInput(name, placeholder) {
  var div = document.createElement("div");
  var label = document.createElement("label");
  var input = document.createElement("input");

  label.for = name;
  label.innerText = name + ": ";

  input.name = name;
  input.type = "text";
  input.classList.add("text");
  input.style.width = "120px";
  input.placeholder = placeholder;


  div.appendChild(label);
  div.appendChild(input);
  
  div.style.marginLeft = "30px";

  ul.appendChild(div);

  return input
}

function createTextSubmit(name, placeholder, callback) {
  var div = document.createElement("div");
  var label = document.createElement("label");
  var input = document.createElement("input");
  var submit = document.createElement("input");

  label.for = name;
  label.innerText = name + ": ";

  input.name = name;
  input.type = "text";
  input.classList.add("text");
  input.style.width = "200px";
  input.placeholder = placeholder;

  submit.type = "button";
  submit.onclick = () => {
    callback(input.value);
  };
  submit.value = "Set"
  submit.classList.add("set-button");

  div.appendChild(label);
  div.appendChild(input);
  div.appendChild(submit)
  
  div.style.marginLeft = "15px";

  ul.appendChild(div);

  return input
}

function createDropdown(name, options, callback) {
  var div = document.createElement("div");
  var button = document.createElement("button");
  var dropdown = document.createElement("div");

  button.innerText = name;

  div.className = "dropdown";
  button.className = "dropbtn";
  dropdown.className = "dropdown-content";
  
  for(let title of options) {
    let selection = document.createElement("a");

    selection.innerText = typeof(title) === "object" ? title.title : title;

    selection.addEventListener("click", () => {
      callback(typeof(title) === "object" ? title.value : title);
    })

    dropdown.appendChild(selection)
  }

  button.addEventListener("click", () => {
    dropdown.classList.toggle("show");
  })

  div.appendChild(button);
  div.appendChild(dropdown);

  ul.appendChild(div);

  return dropdown
}

function createSeriesSelect(callback) {
  var query = "";

  createTextInput("Search", "Show title", (search) => {
    query = search;
  });

  profileDB.stores.profile.get("meta", "current").then(id => {
    profileDB.stores.profile.get(id, "profile").then(profile => {
      browser.storage.local.get("access").then(item => {
        crunchyroll.token = item.access;
        
        crunchyroll.send({
          method: "GET",
          url: "https://www.crunchyroll.com/content/v2/discover/browse?type=series&q=" + encodeURIComponent(query) + "&locale=" + profile.preferred_communication_language + "&preferred_audio_language=" + profile.preferred_content_audio_language
        }, (xml) => {
          let data = JSON.parse(xml.response);

          // console.log(data);
        });
      });
    });
  });
}

function createToggle(name, value, callback) {
  var div = document.createElement("div");
  var body = document.createElement("label");
  var checkbox = document.createElement("input");
  var slider = document.createElement("span");
  var label = document.createElement("label");

  body.className = "switch";

  label.innerText = name;

  checkbox.checked = value;

  checkbox.addEventListener("click", () => {
    value = !value
    callback(value);
  });

  slider.classList.add("slider");
  slider.classList.add("round")

  checkbox.type = "checkbox";

  body.appendChild(checkbox);
  checkbox.after(slider);

  label.style.position = "relative";
  label.style.marginRight = "10px";
  label.style.marginLeft = "10%";
  label.style.top = "20px";

  div.appendChild(body);
  body.before(label);

  ul.appendChild(div);

  return checkbox
}

curated_collection_panel = (ret, info) => {
  ul.innerHTML = "";
  document.body.style.width = "300px";

  og_info = info;

  info = info === undefined ? {
    list_type: "curated_collection",
    title: "",
    description: "",
    position: 5,
    id: getRandomInt(10000000),
    ids: []
  } : info;

  createTextInput(locale.messages.text_input_title, "My New List", (title) => {
    info.title = title;
  }).value = info.title;

  createTextInput("Description", "", (description) => {
    info.description = description;
  }).value = info.description !== undefined ? info.description : "";

  createTextInput(locale.messages.text_input_position, "5", (position) => {
    position = parseInt(position);
    info.position = position;
  }).value = info.position.toString();
}

dynamic_collection_panel = (ret, info) => {
  ul.innerHTML = "";
  document.body.style.width = "300px";

  og_info = info;

  info = info === undefined ? {
    list_type: "dynamic_collection",
    title: "",
    amount: 20,
    position: 5,
    type: "series",
    sort_type: "newly_added",
    seasonal_tag: undefined,
    id: getRandomInt(10000000),
    query: undefined,
    genres: []
  } : info

  const titleInput = createTextInput(locale.messages.text_input_title, "My New List", (title) => {
    info.title = title;
  });

  const searchInput = createTextInput("Search", "Query", (query) => {
    info.query = query;
  });
  
  const amountInput = createTextInput(locale.messages.text_input_amount, "5", (amount) => {
    amount = parseInt(amount);
    info.amount = amount;
  });

  const positionInput = createTextInput(locale.messages.text_input_position, "5", (position) => {
    position = parseInt(position);
    info.position = position;
  });

  titleInput.value = info.title;
  searchInput.value = info.query !== undefined ? info.query : ""
  amountInput.value = info.amount.toString();
  positionInput.value = info.position.toString();

  profileDB.stores.profile.get("meta", "current").then(id => {
    profileDB.stores.profile.get(id, "profile").then(profile => {
      browser.storage.local.get("access").then(item => {
        crunchyroll.token = item.access;

        crunchyroll.send({
          method: "GET",
          url: "https://www.crunchyroll.com/content/v2/discover/seasonal_tags?preferred_audio_language=" + profile.preferred_content_audio_language + "&locale=" + profile.preferred_communication_language
        }, (xml) => {
          let data = JSON.parse(xml.response).data;

          let names = []
          let ids = {}

          for(let tag of data) {
            names.push(tag.localization.title)
            ids[tag.localization.title] = tag.id;
          }

          createDropdown(locale.messages.dropdown_type, ["Episode", "Series"], (type) => {
            type = type.toLowerCase().replaceAll(" ", "_");
            info.type = type;
          })
        
          createDropdown(locale.messages.dropdown_sort_by, ["New", "Alphabetical", "Popular"], (sort_type) => {
            switch(sort_type) {
              case "New":
                sort_type = "newly_added";
                break;
              case "Alphabetical":
                sort_type = "alphabetical";
                break;
              case "Popular":
                sort_type = "popularity";
                break;
            }
            info.sort_type = sort_type;
          })

          createDropdown(locale.messages.dropdown_seasonal_tags, names, (seasonal_tag) => {
            seasonal_tag = ids[seasonal_tag];
            info.seasonal_tag = seasonal_tag
          })

          for(let genre of crunchyroll.categories) {
            createToggle(genre.charAt(0).toUpperCase() + genre.slice(1), info.genres.find(item => item === genre) !== undefined, (toggle) => {
              if(toggle === true) info.genres.push(genre)
              else info.genres.splice(info.genres.indexOf(item => item === genre), 1);
            });
          }

          createOption(locale.messages.done_button, () => {
            info.title = titleInput.value;
            info.query = searchInput.value;
            info.amount = parseInt(amountInput.value);
            info.position = parseInt(positionInput.value)

            if(og_info === undefined) {
              profileDB.stores.profile.get(id, "lists").then(lists => {
                lists = lists === undefined ? {
                 items: []
                } : lists;

                lists.items.push(info);

                profileDB.stores.profile.set(id, "lists", lists);
              })

              return ret();
            }

            profileDB.stores.profile.get(id, "lists").then(lists => {
              let item = lists.items.find(obj => obj.id == info.id);

              for(const [key, value] of Object.entries(info)) {
                item[key] = value;
              }

              profileDB.stores.profile.set(id, "lists", lists);
            })

            return ret();
          })
          createOption("Back", ret);
        })
      })
    })
  })
}

main_callback = () => {
  ul.innerHTML = "";

  document.body.style.width = "150px";
  document.body.style.height = "auto";

  createOption(locale.messages.profile_selection, () => {
      browser.windows.create({url: browser.extension.getURL("/src/pages/profile/profile.html")});
  });


  lists_callback = () => {
    document.body.style.width = "150px";
    document.body.style.height = "auto";

    ul.innerHTML = "";

    createOption(locale.messages.create_list_button, () => {
      ul.innerHTML = "";

      createOption("Dynamic Collection", () => {
        ul.innerHTML = "";
        dynamic_collection_panel(lists_callback);
      })
    })

    createOption(locale.messages.edit_list_button, () => {
      ul.innerHTML = "";
      profileDB.stores.profile.get("meta", "current").then(id => {
        profileDB.stores.profile.get(id, "lists").then(lists => {
          for(let list of lists.items) {
            createOption(list.title, () => {
              switch(list.list_type) {
                case "dynamic_collection":
                default:
                  dynamic_collection_panel(lists_callback, list);
                  break;
              }
            })
          }

          createOption("Back", lists_callback)
        })
      })
    })

    createOption(locale.messages.delete_list_button, () => {
      ul.innerHTML = "";
      profileDB.stores.profile.get("meta", "current").then(id => {
        profileDB.stores.profile.get(id, "lists").then(lists => {
          for(let list in lists.items) {
            let index = list;
            list = lists.items[index];

            createOption(list.title, () => {
              lists.items.splice(index, 1)
              
              profileDB.stores.profile.set(id, "lists", lists);
              lists_callback();
            })
          }

          createOption("Back", lists_callback)
        })
      })
    })

    createOption("Back", main_callback);
  }

  createOption(locale.messages.lists_option, lists_callback)

  createOption(locale.messages.settings_selection, () => {
    ul.innerHTML = "";

    document.body.style.width = "350px";

    profileDB.stores.profile.get("meta", "current").then(id => {
      profileDB.stores.profile.get(id, "settings").then(settings => {
        github.home_feed.getLink().then(link => {
          settings = settings === undefined ? {
            genreFeed: true,
            compactHistory: false
          } : settings

          createToggle(locale.messages.genre_feed_settings, settings.genreFeed, (toggle) => {
            settings.genreFeed = toggle;

            profileDB.stores.profile.set(id, "settings", settings);
          })

          createToggle("Compact History", settings.compactHistory, (toggle) => {
            settings.compactHistory = toggle;

            profileDB.stores.profile.set(id, "settings", settings);
          })
          github.home_feed.getLink().then(link => {
            createTextSubmit("Feed Repo", "Path for your custom homefeed's repo.", (repo) => {
              github.home_feed.setLink(repo);
            }).value = link;

            createOption("Back", main_callback);
          }) 
        })
      })
    })
  });
};

main_callback();