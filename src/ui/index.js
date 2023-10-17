import { collection } from "../api/scripts/collection.js";

collection.css.update(function(css) {
    css.forEach((url) => {
        let style = document.createElement('link');
        
        style.href = url;
        style.rel ='stylesheet';

        document.head.appendChild(style);
    });
})