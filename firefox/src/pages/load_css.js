/*
This script is used to load crunchyroll's css files since they change them frequently.
*/

collection.css.update(function(css) {
    css.forEach((url) => {
        let style = document.createElement('link');
        
        style.href = url;
        style.rel ='stylesheet';

        document.head.appendChild(style);
    });
})