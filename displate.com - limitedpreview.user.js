// ==UserScript==
// @name         Displate Clear Limiteds
// @version      1.0.0
// @license      GPL-3.0
// @namespace    https://github.com/andkramer
// @run-at       document-idle
// @description  Removes the shadow over displate limiteds on the limited page, enables a big preview on click.
// @author       Andre Kramer (mail@akramer.dev)
// @match        https://displate.com/limited-edition
// @grant        none
// @updateURL    https://raw.githubusercontent.com/andkramer/misc-userscripts/master/displate.com - limitedpreview.meta.js
// @downloadURL  https://raw.githubusercontent.com/andkramer/misc-userscripts/master/displate.com - limitedpreview.user.js
// ==/UserScript==

(function() {
    "use strict";
	$('.displate-tile--limited-upcoming').each(function(i, data) {
		console.log(i);
	});
})();
