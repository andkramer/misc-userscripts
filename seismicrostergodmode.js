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

var loadRegionsBtn = "<a style=\"width:154px\" href=\"#\"  class=\"btn btn-xs btn-default-alt btn-block\">Load Regions</a>";
var godModePanel = "<div class=\"gm-panel row\"><div class=\"gm-divname col-sm-9\"></div><div class=\"gm-load-regions col-sm-3\"></div></div>"

function loadRegions() {
    $(".alc-event-results-table > tbody > tr").each(function(i, data) {
        var row = $(this)[0];
        if (row.childElementCount > 3) {
            var profileColumn = row.children[4];
            var profUrl = profileColumn.children[0].href;
            var urlRegex =/.*(\/profile\/.*)/g;
            var relativeUrl = urlRegex.exec(profUrl)[1];
            $.ajax({
                url: relativeUrl,
                context: document.body,
            }).done(function(data) {
                var regex = /<span class=\"team-info__label\">Region:<\/span>\s*<span class="team-info__value ">(.*)<\/span>/g;
                var match = regex.exec(data);
                var regionColumn = row.children[1];
                regionColumn.innerHTML=match[1];
            });
        }
    })
}

function addGodModePanel() {
    var headline = $(".card__header");
    var divName = headline.html();
    headline.empty();
    headline.html(godModePanel);
    $(".gm-panel .gm-divname").append(divName);
    $(".gm-panel .gm-load-regions").append(loadRegionsBtn);
    $(".gm-panel .gm-load-regions > a").click(loadRegions);
}

(function() {
    "use strict";
    addGodModePanel();
})();
