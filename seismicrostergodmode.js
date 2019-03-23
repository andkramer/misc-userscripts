// ==UserScript==
// @name         Seismic Roster Godmode
// @version      0.0.1
// @license      GPL-3.0
// @namespace    https://github.com/andkramer
// @run-at       document-idle
// @description  TODO
// @author       Andre Kramer (and.kramer@live.de)
// @match        https://seismicgaming.eu/divisions/*/roster
// @grant        none
// @updateURL    https://raw.githubusercontent.com/andkramer/misc-userscripts/master/seismicrostergodmode.js
// @downloadURL  https://raw.githubusercontent.com/andkramer/misc-userscripts/master/seismicrostergodmode.js
// ==/UserScript==

var $ = window.jQuery;

function loadRegions() {
    $(".alc-event-results-table > tbody > tr").each(function(i, data) {
        var row = $(this);
        if (row[0].childElementCount > 3) {
            var profUrl = row[0].children[4].children[0].href;
            var urlRegex =/.*(\/profile\/.*)/g;
            var relativeUrl = urlRegex.exec(profUrl)[1];
            $.ajax({
                url: relativeUrl,
                context: document.body,
            }).done(function(data) {
                var regex = /<span class=\"team-info__label\">Region:<\/span>\s*<span class="team-info__value ">(.*)<\/span>/g;
                var match = regex.exec(data);
                row[0].children[1].innerHTML=match[1];
            });
        }
    })
}

(function() {
    "use strict";
    var loadRegionsBtn = "<a onclick=\"loadRegions()\" style=\"width:154px\" href=\"#\"  class=\"btn btn-xs btn-default-alt btn-block\">Load Regions</a>";
    var headline = $(".card__header");
    headline.append(loadRegionsBtn);
    $(".card__header > a").click(loadRegions);
})();
