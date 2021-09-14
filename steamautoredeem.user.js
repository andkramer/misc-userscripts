// ==UserScript==
// @name         Steam Key Auto Redeem
// @version      1.0.2
// @license      GPL-3.0
// @namespace    https://github.com/andkramer
// @run-at       document-idle
// @description  Removes the shadow over displate limiteds on the limited page, enables a big preview on click.
// @author       Andre Kramer (mail@akramer.dev)
// @match        https://store.steampowered.com/account/registerkey?key=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/andkramer/misc-userscripts/master/steamautoredeem.js
// @downloadURL  https://raw.githubusercontent.com/andkramer/misc-userscripts/master/steamautoredeem.js
// ==/UserScript==

var observer = new MutationObserver(closeTab);

function closeTab(changes, observer) {
    if(document.querySelector('#receipt_form')) {
        if(document.getElementById("receipt_form").style.display != "none") {
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
