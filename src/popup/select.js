const removeError = `
if(document.body.querySelector(".flash-message__wrapper--UWCF8"))
  document.body.querySelector(".flash-message__wrapper--UWCF8").remove();
`;

function tabExec(script) {
  browser.tabs.executeScript({
    code: removeError + script
  });
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

createOption(locale.messages.profile_selection, function() {
    browser.windows.create({url: browser.extension.getURL("/src/pages/profile/profile.html")});
});