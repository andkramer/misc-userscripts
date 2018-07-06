// ==UserScript==
// @name         Steam Key Auto Redeem
// @version      1.0
// @namespace    https://github.com/andkramer
// @run-at       document-idle
// @description  Automatically Accepts Steam Subscriber Agreement and Registers Product Key, Closes Tab after that happend successfully, keeps it open if an error occurs
// @author       Andre Kramer (akramer@codingbros.io)
// @match        https://store.steampowered.com/account/registerkey?key=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/andkramer/steamautoredeem/master/steamautoredeem.js
// @downloadURL  https://raw.githubusercontent.com/andkramer/steamautoredeem/master/steamautoredeem.js
// ==/UserScript==

var observer = new MutationObserver(closeTab);

function closeTab(changes, observer) {
    if(document.querySelector('#receipt_form')) {
        if(document.getElementById("receipt_form").style.display != "none") {
            console.log("Registration done!");
            observer.disconnect();
            window.close();
        }
    }
}

(function() {
    "use strict";
    // Register Observer to close tab when successful receipt is given
    observer.observe(document, {childList: true, subtree: true});
    document.getElementById("accept_ssa").checked = true;
    if (typeof RegisterProductKey === "function") {
        RegisterProductKey();
    };
})();
