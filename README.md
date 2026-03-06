# Misc Userscripts

This project contains various miscellanous userscripts to run in tampermonkey or greasemonkey

## steamautoredeem.js

When trying to redeem a steam key via [Steam Store Key Registration][0] this automatically accepts the steam subscriber agreement and redeems the key. The Tab is closed after a successful registration and kept open if the registration fails.

This can as an example easily be used to redeem multiple humble bundle keys from the humble bundle key page, if you have many unredeemed keys, like i had.

## poedb_vaal_roll.user.js

Adds a small button to every item on the [poedb.tw unique items page](https://poedb.tw/us/Unique_item). Click it to see what the item's explicit mod roll ranges would look like after applying a Vaal Orb — min values get pushed down a bit, max values up. Click again to revert. There's also a **Vaal All** button in each section header to toggle everything at once. Values are pre-calculated in the background on page load so toggling is instant.

> ⚠️ This is currently a prototype. The calculation formula is based on research shared in the Forbidden Library Discord community and may not be 100% accurate for all cases.


[0]: https://store.steampowered.com/account/registerkey?key=SOME-KEY-HERE
