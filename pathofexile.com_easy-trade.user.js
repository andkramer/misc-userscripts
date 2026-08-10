// ==UserScript==
// @name         PoE Trade Quick Filters
// @namespace    poe-trade-qf
// @version      5.3-BETA
// @description  Compact mirror bar for the PoE trade search filters
// @match        https://www.pathofexile.com/trade/search/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://github.com/andkramer/misc-userscripts/raw/refs/heads/rarity_improvments/pathofexile.com_easy-trade.meta.js
// @downloadURL  https://github.com/andkramer/misc-userscripts/raw/refs/heads/rarity_improvments/pathofexile.com_easy-trade.user.js
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = false;
  const ICON_SIZE = 30;
  const HIDE_CONTROLS = true;   // clip the site's own controls bar
  const RADIUS = '4px';
  const POLL_MS = 1000;        // fallback tick where Vue changes fire no event
  const SLOW_SELECT = false;   // step through selectOption with visible delays
  const STEP_MS = 1500;        // pause between steps when SLOW_SELECT is on

  // The site's own "Back to Top" button owns the bottom-right corner. Ours
  // copies its geometry and colours and stacks one gap above it.
  const TOP_BUTTON_SELECTOR = '.top-btn';
  const CORNER_SIZE = 48;
  const CORNER_GAP = 20;
  const CORNER_PALETTE = { bg: '#0f304d', border: '#4c4c7d' };
  // Keep sampling this long after the last movement; covers .top-btn's own
  // 0.2s slide plus slack.
  const CORNER_SETTLE_MS = 350;

  const ART_BASE = 'https://web.poecdn.com/image/Art/2DItems/';
  const iconUrl = (path) => `${ART_BASE}${path}.png`;

  // Toggle buttons. `path` is relative to 2DItems/, without .png
  const TRISTATE_FILTERS = [
    { label: 'Identified', filterTitle: 'Identified',
      path: 'Currency/CurrencyIdentification',
      states: ['Any', 'No', 'Yes'], glow: 'rgba(200,180,130,.9)' },
    { label: 'Corrupted', filterTitle: 'Corrupted',
      path: 'Currency/CurrencyVaal',
      states: ['Any', 'No', 'Yes'], glow: 'rgba(224,90,58,.9)' },
    { label: 'Foulborn', filterTitle: 'Foulborn',
      path: 'Currency/Chayula/FoulbornRegal',
      states: ['Any', 'No', 'Yes'], glow: 'rgba(190,120,220,.9)' },
    { label: 'Fractured', filterTitle: 'Fractured Item',
      path: 'Currency/FracturingOrbCombined',
      states: ['Any', 'No', 'Yes'], glow: 'rgba(160,190,255,.9)' },
    { label: 'Mirrored', filterTitle: 'Mirrored',
      path: 'Currency/CurrencyDuplicate',
      states: ['Any', 'No', 'Yes'], glow: 'rgba(150,200,230,.9)' }
  ];

  const RANGE_FILTERS = [
    { label: 'iLvl',    filterTitle: 'Item Level' },
    { label: 'Gem Lvl', filterTitle: 'Gem Level' },
    { label: 'Quality',    filterTitle: 'Quality' },
    { label: 'Strands', filterTitle: 'Memory Strands' }
  ];

  // Nothing uses the generic dropdown mirror right now; Item Rarity moved to
  // the button strip below. Kept so another combobox filter can be added.
  const DROPDOWN_FILTERS = [];

  // Item Rarity shortcuts. `option` must match the original text exactly.
  // The tints come from the site's own item-colour custom properties
  // (--color-game-normal-item and friends), so they read as in-game. The
  // exception is unique: at its true rgb(175, 96, 37) it is far darker than
  // the other three and vanishes beside them, so the chip uses a lightened
  // version of the same hue.
  const RARITIES = [
    { label: 'N', option: 'Normal',         rgb: '200, 200, 200' },
    { label: 'M', option: 'Magic',          rgb: '136, 136, 255' },
    { label: 'R', option: 'Rare',           rgb: '255, 255, 119' },
    { label: 'U', option: 'Unique',         rgb: '222, 138, 62' },
    // A struck-through U: everything that is not unique.
    { label: 'U', option: 'Any Non-Unique', rgb: '222, 138, 62', struck: true }
  ];

  // Buyout currency shortcuts. `option` must match the original text exactly.
  const CURRENCIES = [
    { label: 'Any', option: 'Chaos Orb Equivalent' },
    { icon: 'Currency/CurrencyRerollRare', option: 'Chaos Orb',  title: 'Chaos Orb' },
    { icon: 'Currency/CurrencyModValues',  option: 'Divine Orb', title: 'Divine Orb' }
  ];

  // Each entry: CSS selectors first, text pattern as fallback
  const SITE_BUTTONS = {
    live:    { selectors: ['.btn.livesearch-btn', '.btn.live-search-btn'], text: /live\s*search/i },
    clear:   { selectors: ['.btn.clear-btn'],                              text: /^clear$/i },
    filters: { selectors: ['.btn.toggle-search-btn'],                      text: /(show|hide)\s*filters/i },
    search:  { selectors: ['.btn.search-btn'],                             text: /^search$/i }
  };

  const ICON_STATE_LOOK = {
    Any: { filter: 'grayscale(0.85) brightness(1.25) contrast(1.1)', opacity: '0.85' },
    Yes: { filter: 'brightness(1.15)', opacity: '1' },
    No:  { filter: 'brightness(0.85) saturate(0.8)', opacity: '1' }
  };

  const SEARCH_ICON_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" ' +
    'stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
    '<circle cx="10" cy="10" r="6"/><line x1="15" y1="15" x2="20" y2="20"/></svg>';

  (function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `
      #qf-bar input[type=number]::-webkit-outer-spin-button,
      #qf-bar input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none; appearance: none; margin: 0;
      }
      #qf-bar input[type=number] {
        -moz-appearance: textfield; appearance: textfield;
      }
      #qf-bar .qf-row {
        display: flex; align-items: center; gap: 10px; width: 100%;
      }
      #qf-bar .qf-row + .qf-row {
        margin-top: 8px; padding-top: 8px; border-top: 1px solid #262118;
      }
      /* label, inputs and clear button share one frame */
      #qf-bar .qf-field {
        display: inline-flex; align-items: stretch; height: 26px;
        border: 1px solid #3b3428; border-radius: ${RADIUS};
        overflow: hidden; background: #14120e;
      }
      #qf-bar .qf-field:focus-within { border-color: #6b5f47; }
      #qf-bar .qf-field-label {
        display: inline-flex; align-items: center; padding: 0 9px;
        background: #0a0906; border-right: 1px solid #4a4232;
        color: #c9b78f; font-size: 11px; font-weight: 600;
        letter-spacing: .6px; text-transform: uppercase; white-space: nowrap;
      }
      #qf-bar .qf-field select {
        height: 100%; max-width: 190px; padding: 0 6px;
        border: 0; background: #1b1813; color: #e0d6c0;
        font-size: 12px; font-family: inherit; outline: none; cursor: pointer;
      }
      #qf-bar .qf-field select:focus { background: #262119; }
      #qf-bar .qf-inputs { display: inline-flex; }
      #qf-bar .qf-inputs input {
        width: 40px; padding: 0 5px; border: 0; background: #1b1813;
        color: #e0d6c0; font-size: 12px; font-family: inherit;
        text-align: center; outline: none;
      }
      #qf-bar .qf-inputs input:first-child { border-right: 1px solid #2b261d; }
      #qf-bar .qf-inputs input::placeholder { color: #554e42; }
      #qf-bar .qf-inputs input:focus { background: #262119; }
      #qf-bar .qf-clear {
        display: inline-flex; align-items: center; justify-content: center;
        width: 20px; padding: 0; border: 0; border-left: 1px solid #4a4232;
        background: rgba(150,40,32,.18); color: #d9503f;
        font-size: 14px; font-weight: 700; line-height: 1; cursor: pointer;
        transition: color .12s, background .12s;
      }
      #qf-bar .qf-clear:hover { color: #fff; background: #c0392b; }
      #qf-bar .qf-cur {
        display: inline-flex; align-items: center; gap: 2px; height: 26px;
        padding: 0 4px; border: 1px solid #3b3428;
        border-radius: ${RADIUS}; background: #14120e;
      }
      #qf-bar .qf-cur-btn {
        display: inline-flex; align-items: center; justify-content: center;
        height: 20px; min-width: 24px; padding: 0 5px;
        border: 1px solid transparent; border-radius: 3px; background: transparent;
        color: #7d7160; font-size: 11px; font-weight: 600; font-family: inherit;
        line-height: 1; cursor: pointer;
        transition: background .12s, color .12s, border-color .12s;
      }
      #qf-bar .qf-cur-btn img {
        display: block; width: 18px; height: 18px; object-fit: contain;
        filter: grayscale(1) brightness(1.3); opacity: .55;
        transition: filter .12s, opacity .12s;
      }
      #qf-bar .qf-cur-btn:hover { background: rgba(255,255,255,.06); }
      #qf-bar .qf-cur-btn.is-active {
        background: #2b2519; border-color: #6b5f47; color: #e8d9b5;
      }
      #qf-bar .qf-cur-btn.is-active img { filter: none; opacity: 1; }
      /* Rarity strip: same frame as the currency one, but each button is
         tinted with its item colour instead of carrying an icon. The tints
         themselves are applied inline, since they vary per button. */
      #qf-bar .qf-rar-btn {
        position: relative;
        display: inline-flex; align-items: center; justify-content: center;
        height: 22px; min-width: 26px; padding: 0 7px;
        border: 1px solid transparent; border-radius: 3px;
        font-size: 11px; font-weight: 700; font-family: inherit;
        letter-spacing: .5px; line-height: 1; cursor: pointer;
        text-shadow: 0 1px 2px rgba(0, 0, 0, .85);
        transition: background .12s, border-color .12s, color .12s,
                    box-shadow .12s, transform .12s;
      }
      #qf-bar .qf-rar-btn:hover { filter: brightness(1.3); transform: translateY(-1px); }
      #qf-bar .qf-rar-btn:active { transform: translateY(0); }
      /* A drawn bar rather than text-decoration: at this size line-through
         renders as a hairline and is easy to miss. currentColor keeps it in
         step with the button's own idle/picked colour. */
      #qf-bar .qf-rar-btn.is-struck::after {
        content: ''; position: absolute; left: 12%; right: 12%; top: 50%;
        height: 2.5px; margin-top: -1.25px; border-radius: 2px;
        background: currentColor;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, .7);
        pointer-events: none;
      }
      #qf-bar .qf-rar-sep {
        flex: 0 0 auto; width: 1px; height: 15px; margin: 0 3px;
        background: #3b3428;
      }
      #qf-bar .qf-rar-clear {
        min-width: 22px; padding: 0 5px; font-size: 13px;
        background: linear-gradient(180deg, rgba(150, 40, 32, .3), rgba(150, 40, 32, .1));
        border-color: rgba(217, 80, 63, .35);
        color: #d9503f;
      }
      #qf-bar .qf-rar-clear:hover {
        background: #c0392b; border-color: #e0705f; color: #fff; filter: none;
      }
      #qf-bar .power-control-btn { border-radius: ${RADIUS}; }
      #qf-bar .power-control-btn:hover { background: rgba(255,255,255,.06); }
      #qf-bar .power-control-mirror:hover { filter: brightness(1.15); }
      /* Anchored like the site's own .top-btn corner button and stacked one
         gap above it. followCornerButton() keeps right/bottom in step; the
         values here are only the fallback for when .top-btn is missing.
         Deliberately no transition: we sample .top-btn's already-animating
         position per frame, so easing it again would only add lag. */
      .qf-floating-actions {
        position: fixed; z-index: 500;
        right: ${CORNER_GAP}px;
        bottom: ${CORNER_GAP + CORNER_SIZE + CORNER_GAP}px;
        display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
      }
      .qf-floating-actions .power-control-mirror:hover { filter: brightness(1.3); }
    `;
    (document.head || document.documentElement).appendChild(style);
  })();

  // --- Lifecycle -----------------------------------------------------------

  // Every observer/timer a widget starts registers its teardown here, so
  // rebuilding the mirror UI (see ensureMirrorUI) does not leave orphaned
  // watchers polling detached nodes for the rest of the session.
  const disposers = [];

  function registerDisposer(dispose) {
    disposers.push(dispose);
  }

  function disposeAll() {
    while (disposers.length) disposers.pop()();
  }

  // Watches a vue-multiselect for selection changes. Vue swaps the
  // --selected class without firing an event we can hook, and sometimes
  // without touching the class at all, hence the extra poll.
  function watchMultiselect(multiselect, onChange) {
    const observer = new MutationObserver(onChange);
    observer.observe(multiselect, {
      attributes: true, subtree: true, attributeFilter: ['class']
    });
    const timer = setInterval(onChange, POLL_MS);
    registerDisposer(() => { observer.disconnect(); clearInterval(timer); });
  }

  // --- DOM helpers ---------------------------------------------------------

  // Resolves once test() returns something truthy, then stops observing.
  function waitFor(test, onFound, timeout = 20000, label = 'unlabeled') {
    const immediate = test();
    if (immediate) {
      if (DEBUG) console.log(`[QF/wait:${label}] found immediately`);
      return onFound(immediate);
    }
    if (DEBUG) console.log(`[QF/wait:${label}] not found yet, observing...`);

    let observer = null;
    let timer = null;
    const stop = () => {
      if (observer) observer.disconnect();
      clearTimeout(timer);
    };

    observer = new MutationObserver(() => {
      const found = test();
      if (!found) return;
      stop();
      if (DEBUG) console.log(`[QF/wait:${label}] found via mutation`);
      onFound(found);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    timer = setTimeout(() => {
      stop();
      console.warn(`[QF] timed out waiting for element: ${label}`);
    }, timeout);

    // A pending wait belongs to the generation that started it; abandon it
    // when that generation is torn down.
    registerDisposer(stop);
  }

  // Waits for a filter whose vue-multiselect has been rendered.
  function waitForMultiselectFilter(filterTitle, onFound) {
    waitFor(() => {
      const filter = findFilterByTitle(filterTitle);
      return filter && filter.querySelector('.multiselect') ? filter : null;
    }, onFound, 20000, `filter:${filterTitle}`);
  }

  function findSiteButton(spec, scope) {
    const root = scope || document;
    for (const selector of spec.selectors) {
      const found = root.querySelector(selector);
      if (found) return found;
    }
    const candidates = [...root.querySelectorAll('.btn, button, a.btn')];
    return candidates.find(el => spec.text.test((el.textContent || '').trim())) || null;
  }

  // Site buttons wrap their caption in a span next to an icon span.
  function captionOf(element) {
    const spans = [...element.querySelectorAll('span')]
      .filter(span => (span.textContent || '').trim().length > 0);
    if (spans.length) return spans[spans.length - 1].textContent.trim();
    return (element.textContent || '').trim();
  }

  const findFilterByTitle = (title) =>
    [...document.querySelectorAll('.filter')].find(filter => {
      const titleEl = filter.querySelector(':scope > .filter-body > .filter-title');
      return titleEl && titleEl.textContent.trim().startsWith(title);
    });

  // The bar holding Live Search / Search / Clear / Show Filters.
  // Not to be confused with .search-advanced, which holds the filters.
  function findControlsBar() {
    const direct = document.querySelector('.search-panel > .controls, .controls');
    if (direct && direct.id !== 'qf-bar') {
      if (DEBUG) console.log('[QF/tab] findControlsBar: matched direct selector', direct);
      return direct;
    }

    const liveButton = findSiteButton(SITE_BUTTONS.live);
    if (liveButton) {
      const container = liveButton.closest('.controls') || liveButton.parentElement;
      if (container && container.id !== 'qf-bar') {
        if (DEBUG) console.log('[QF/tab] findControlsBar: matched via live button', container);
        return container;
      }
    }
    if (DEBUG) console.log('[QF/tab] findControlsBar: nothing found this pass');
    return null;
  }

  const readSelected = (multiselect) => {
    const selected = multiselect.querySelector('.multiselect__option--selected');
    return selected ? selected.textContent.trim() : 'Any';
  };

  // A filter group is active when its header toggle is not marked "off".
  const GROUP_SELECTOR = '.filter-group';
  const GROUP_TOGGLE_SELECTOR = '.filter-group-header .toggle-btn';

  const groupToggleOf = (group) =>
    group ? group.querySelector(GROUP_TOGGLE_SELECTOR) : null;

  function isGroupEnabled(group) {
    const toggle = groupToggleOf(group);
    return !toggle || !toggle.classList.contains('off');
  }

  function enableGroupFor(element) {
    const group = element && element.closest(GROUP_SELECTOR);
    if (!group || isGroupEnabled(group)) return false;

    const toggle = groupToggleOf(group);
    if (DEBUG) console.log('[QF/group] activating:', toggle.className);

    for (const type of ['mousedown', 'mouseup', 'click']) {
      toggle.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window
      }));
    }

    const enabled = !toggle.classList.contains('off');
    if (!enabled) console.warn('[QF/group] toggle did not switch:', toggle.className);
    return enabled;
  }

  // Mirrored inputs register here so we can expand their groups before a search
  const trackedOriginals = new Set();

  function enableGroupsForFilledFields() {
    trackedOriginals.forEach((original) => {
      if (original.value !== undefined && original.value !== '') {
        enableGroupFor(original);
      }
    });
  }

  // --- Live search lock ----------------------------------------------------

  // A running live search keeps re-querying with the filters it started
  // with, so editing them mid-run is misleading. Everything that changes
  // the query gets disabled; Clear, Show/Hide Filters and the Live Search
  // toggle itself stay usable so the run can be ended or reset.
  let filtersLocked = false;
  const lockables = [];

  // `refresh` re-derives the element's final state. It is a callback rather
  // than a plain element because some controls (the reset buttons) have
  // their own enabled/disabled rule to combine with the lock.
  function registerLockable(refresh) {
    lockables.push(refresh);
    refresh();
  }

  function setLockedState(element, locked) {
    element.disabled = locked;
    element.style.opacity = locked ? '0.4' : '';
    element.style.pointerEvents = locked ? 'none' : '';
  }

  // For controls whose only disabled-reason is the lock.
  function lockElement(element) {
    registerLockable(() => setLockedState(element, filtersLocked));
  }

  function applyFilterLock(locked) {
    if (locked === filtersLocked) return;
    filtersLocked = locked;
    if (DEBUG) console.log('[QF/lock] filters locked:', locked);
    lockables.forEach(refresh => refresh());
  }

  // Heuristic: the site flags the running state on the Live Search button
  // itself, either through a class or by relabelling it.
  function isLiveSearchActive() {
    const original = findSiteButton(SITE_BUTTONS.live);
    if (!original) return false;

    const childClasses = [...original.querySelectorAll('span')]
      .map(span => span.className).join(' ');
    const classes = `${original.className} ${childClasses}`;
    return /\bactive\b|\brunning\b|live-active|\bconnected\b/i.test(classes) ||
      /stop|deactivate|disconnect/i.test(captionOf(original));
  }

  function watchLiveSearchState() {
    waitFor(() => findSiteButton(SITE_BUTTONS.live), (original) => {
      // Logged on change only, so the heuristic above can be corrected
      // against what the button actually looks like while running.
      let lastSignature = null;
      const update = () => {
        if (DEBUG) {
          const signature = `${original.className} | "${captionOf(original)}"`;
          if (signature !== lastSignature) {
            lastSignature = signature;
            console.log('[QF/lock] live button signature:', signature);
          }
        }
        applyFilterLock(isLiveSearchActive());
      };
      update();

      const observer = new MutationObserver(update);
      observer.observe(original, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'style']
      });
      const timer = setInterval(update, POLL_MS);
      registerDisposer(() => { observer.disconnect(); clearInterval(timer); });
    }, 10000, 'live-search-button');
  }

  // vue-multiselect ignores direct value assignment. Filter its list, then
  // click the exact match directly — Enter would take the highlighted entry,
  // which is wrong whenever one option is a prefix of another
  // ("Chaos Orb" vs "Chaos Orb Equivalent").
  function selectOption(multiselect, optionText) {
    const input = multiselect.querySelector('.multiselect__input');
    const scrollY = window.scrollY;
    const delay = SLOW_SELECT ? STEP_MS : 40;
    const log = (...args) => {
      if (SLOW_SELECT || DEBUG) console.log('[QF/select]', ...args);
    };

    log('target:', optionText, '| current:', readSelected(multiselect));
    enableGroupFor(multiselect);

    input.focus({ preventScroll: true });
    input.value = optionText;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    setTimeout(() => {
      const wanted = optionText.trim().toLowerCase();
      const optionEl = [...multiselect.querySelectorAll('.multiselect__option')]
        .find(el => el.textContent.trim().toLowerCase() === wanted);

      if (!optionEl) {
        console.warn('[QF/select] exact option not in list:',
          optionText, '- visible:', optionTexts(multiselect));
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.blur();
        return;
      }

      log('clicking:', optionEl.textContent.trim());
      for (const type of ['mousedown', 'mouseup', 'click']) {
        optionEl.dispatchEvent(new MouseEvent(type, {
          bubbles: true, cancelable: true, view: window
        }));
      }

      setTimeout(() => {
        const result = readSelected(multiselect);
        log('result:', result, result === optionText ? '- OK' : '- MISMATCH');
        input.blur();
        if (!SLOW_SELECT) window.scrollTo(0, scrollY);
      }, delay);
    }, delay);
  }

  // Vue overrides the value setter, so reach for the native one.
  function setInputValue(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input), 'value');
    if (descriptor && descriptor.set) descriptor.set.call(input, value);
    else input.value = value;

    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const optionTexts = (multiselect) =>
    [...multiselect.querySelectorAll('.multiselect__option')]
      .map(option => option.textContent.trim())
      .filter(text => text && !/no elements found/i.test(text));

  // Resolves `wanted` (lower case) to the option's exact original spelling.
  // vue-multiselect renders its options lazily, so focusing the input first
  // forces the list into the DOM when the plain lookup comes up empty.
  function findOptionText(multiselect, wanted) {
    let texts = optionTexts(multiselect);
    let match = texts.find(text => text.toLowerCase() === wanted);
    if (match) return match;

    const input = multiselect.querySelector('.multiselect__input');
    if (input) {
      input.focus({ preventScroll: true });
      texts = optionTexts(multiselect);
      match = texts.find(text => text.toLowerCase() === wanted);
      input.blur();
    }
    if (!match) {
      console.warn('[QF] option not found:', wanted, '- available:', texts);
    }
    return match || null;
  }

  // --- Icons ---------------------------------------------------------------

  function banSvg(size) {
    return `
<svg viewBox="0 0 32 32" width="${size}" height="${size}" style="display:block;">
  <circle cx="16" cy="16" r="13" fill="none"
          stroke="#000" stroke-opacity="0.75" stroke-width="5.5"/>
  <line x1="7" y1="25" x2="25" y2="7"
        stroke="#000" stroke-opacity="0.75" stroke-width="6" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="13" fill="none"
          stroke="#e8352a" stroke-width="3.2"/>
  <line x1="7" y1="25" x2="25" y2="7"
        stroke="#e8352a" stroke-width="3.4" stroke-linecap="round"/>
</svg>`;
  }

  function placeholderSvg(banned, size, label) {
    const initial = (label || '?').charAt(0).toUpperCase();
    return `
<span style="position:relative;display:inline-flex;width:${size}px;height:${size}px;">
<svg width="${size}" height="${size}" viewBox="0 0 32 32" style="display:block;">
  <circle cx="16" cy="16" r="12" fill="#3a3226" stroke="#a38d6d" stroke-width="1.4"/>
  <text x="16" y="21" text-anchor="middle" font-size="14"
        font-family="sans-serif" fill="#e0d6c0">${initial}</text>
</svg>
${banned ? `<span style="position:absolute;inset:0;">${banSvg(size)}</span>` : ''}
</span>`;
  }

  // Returns a span with a setState(state) method driving look and ban overlay.
  function createStateIcon(size, url, label, glow) {
    const box = document.createElement('span');
    box.style.cssText =
      `position:relative;display:inline-flex;width:${size}px;height:${size}px;` +
      'flex:0 0 auto;';

    const image = document.createElement('img');
    image.src = url;
    image.style.cssText =
      `width:${size}px;height:${size}px;object-fit:contain;` +
      'transition:filter .12s, opacity .12s;';

    const banOverlay = document.createElement('span');
    banOverlay.style.cssText =
      'position:absolute;inset:0;display:none;pointer-events:none;';
    banOverlay.innerHTML = banSvg(size);

    box.appendChild(image);
    box.appendChild(banOverlay);

    let imageFailed = false;
    let banned = false;

    image.addEventListener('error', () => {
      imageFailed = true;
      console.warn('[QF] icon failed to load:', url);
      box.innerHTML = placeholderSvg(banned, size, label);
    });

    box.setState = (state) => {
      banned = (state === 'No');
      const look = ICON_STATE_LOOK[state] || ICON_STATE_LOOK.Any;

      if (imageFailed) {
        box.innerHTML = placeholderSvg(banned, size, label);
        box.style.opacity = look.opacity;
        box.style.filter = look.filter;
        return;
      }
      banOverlay.style.display = banned ? 'block' : 'none';
      image.style.opacity = look.opacity;
      image.style.filter = state === 'Yes'
        ? `${look.filter} drop-shadow(0 0 4px ${glow})`
        : look.filter;
    };

    return box;
  }

  // --- Mirrored widgets ----------------------------------------------------

  function addTristateButton(slot, config) {
    const { label, filterTitle, states, path, glow } = config;

    // Reserve the slot immediately so display order stays stable
    const holder = document.createElement('span');
    holder.style.cssText = 'display:inline-flex;';
    slot.appendChild(holder);

    waitForMultiselectFilter(filterTitle, (filter) => {
      const multiselect = filter.querySelector('.multiselect');
      if (DEBUG) console.log('[QF] tristate filter ready:', filterTitle);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'power-control-btn';
      button.dataset.filter = filterTitle;
      button.style.cssText =
        'display:flex;align-items:center;justify-content:center;' +
        'padding:2px;margin:0;border:0;background:none;box-shadow:none;' +
        'cursor:pointer;line-height:0;transition:background .12s;';

      const icon = createStateIcon(ICON_SIZE, iconUrl(path), label, glow);
      button.appendChild(icon);

      let rendered = null;
      const render = () => {
        const state = readSelected(multiselect);
        if (state === rendered) return;
        rendered = state;
        icon.setState(state);
        button.title = `${label}: ${state}`;
      };

      button.addEventListener('click', () => {
        const index = states.indexOf(readSelected(multiselect));
        selectOption(multiselect, states[(index + 1) % states.length]);
        setTimeout(render, 120);
      });

      render();
      setTimeout(render, 500);
      lockElement(button);

      // Pick up external changes: Clear button, URL load, original combobox
      watchMultiselect(multiselect, render);

      holder.appendChild(button);
    });
  }

  // Two-way binding between a mirrored input and its original.
  // `onChange` fires whenever copy.value actually changes, from either side.
  function bindInput(copy, original, onChange) {
    let writing = false;

    const pushToOriginal = () => {
      writing = true;
      if (copy.value !== '') enableGroupFor(original);
      setInputValue(original, copy.value);
      setTimeout(() => { writing = false; }, 60);
      if (onChange) onChange();
    };

    copy.addEventListener('input', pushToOriginal);
    copy.addEventListener('change', pushToOriginal);
    copy.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      pushToOriginal();
      setTimeout(() => {
        original.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
      }, 50);
    });

    const pullFromOriginal = () => {
      if (writing) return;
      if (copy.value === original.value) return;
      copy.value = original.value || '';
      if (onChange) onChange();
    };

    const observer = new MutationObserver(pullFromOriginal);
    observer.observe(original, { attributes: true, attributeFilter: ['value'] });
    original.addEventListener('input', pullFromOriginal);
    original.addEventListener('change', pullFromOriginal);
    // Vue writes .value without touching the attribute, so poll as well
    const timer = setInterval(pullFromOriginal, POLL_MS);
    registerDisposer(() => { observer.disconnect(); clearInterval(timer); });

    trackedOriginals.add(original);
    return pushToOriginal;
  }

  function createMirroredInput(original) {
    const copy = document.createElement('input');
    copy.type = 'number';
    copy.placeholder = original.placeholder || '';
    copy.value = original.value || '';
    copy.maxLength = original.maxLength > 0 ? original.maxLength : 4;
    copy.step = original.step || 'any';
    copy.inputMode = 'numeric';
    return copy;
  }

  function createResetButton(label, entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'qf-clear';
    button.textContent = '×';

    const syncState = () => {
      const active = !filtersLocked && entries.some(({ copy }) => copy.value !== '');
      button.disabled = !active;
      button.title = active ? `Reset ${label}` : '';
      button.style.opacity = active ? '1' : '0.35';
      button.style.pointerEvents = active ? 'auto' : 'none';
    };

    button.addEventListener('click', () => {
      entries.forEach(({ copy, push }) => { copy.value = ''; push(); });
      syncState();
    });

    button.syncState = syncState;
    registerLockable(syncState);
    return button;
  }

  function addFieldLabel(group, label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'qf-field-label';
    labelEl.textContent = label;
    group.appendChild(labelEl);
  }

  const numberInputsOf = (filter) =>
    [...filter.querySelectorAll('input.minmax, input[type="number"]')];

  // Fills a .qf-field group with mirrored min/max inputs and their reset
  // button. Shared by the plain range filters and Buyout Price.
  function addMirroredInputs(group, originals, label) {
    const inputWrap = document.createElement('span');
    inputWrap.className = 'qf-inputs';
    group.appendChild(inputWrap);

    // The reset button only exists after its entries do, so route the
    // change notification through a placeholder until it is built.
    let notifyClearState = () => {};
    const entries = originals.map((original) => {
      const copy = createMirroredInput(original);
      const push = bindInput(copy, original, () => notifyClearState());
      lockElement(copy);
      inputWrap.appendChild(copy);
      return { copy, push };
    });

    const resetButton = createResetButton(label, entries);
    notifyClearState = resetButton.syncState;
    group.appendChild(resetButton);
  }

  function addRangeMirror(slot, config) {
    const { label, filterTitle } = config;

    const group = document.createElement('span');
    group.className = 'qf-field';
    slot.appendChild(group);

    waitFor(() => {
      const filter = findFilterByTitle(filterTitle);
      if (!filter) return null;
      const inputs = numberInputsOf(filter);
      return inputs.length ? inputs : null;
    }, (originals) => {
      if (DEBUG) console.log('[QF] range filter ready:', filterTitle,
        '- fields:', originals.length);

      addFieldLabel(group, label);
      addMirroredInputs(group, originals, label);
    }, 20000, `range:${filterTitle}`);
  }

  function addDropdownMirror(slot, config) {
    const { label, filterTitle } = config;

    const group = document.createElement('span');
    group.className = 'qf-field';
    slot.appendChild(group);

    waitForMultiselectFilter(filterTitle, (filter) => {
      const multiselect = filter.querySelector('.multiselect');
      if (DEBUG) console.log('[QF] dropdown filter ready:', filterTitle);

      addFieldLabel(group, label);

      const select = document.createElement('select');
      lockElement(select);
      group.appendChild(select);

      let rebuilding = false;

      const rebuildOptions = () => {
        const texts = optionTexts(multiselect);
        if (!texts.length) return false;

        const current = readSelected(multiselect);
        rebuilding = true;
        select.innerHTML = '';
        texts.forEach(text => {
          const option = document.createElement('option');
          option.value = text;
          option.textContent = text;
          select.appendChild(option);
        });
        // Keep the active value selectable even if it is not in the rendered list
        if (![...select.options].some(option => option.value === current)) {
          const option = document.createElement('option');
          option.value = current;
          option.textContent = current;
          select.insertBefore(option, select.firstChild);
        }
        select.value = current;
        rebuilding = false;
        return true;
      };

      if (!rebuildOptions()) setTimeout(rebuildOptions, 600);

      // vue-multiselect renders options lazily, so refresh before opening
      select.addEventListener('mousedown', rebuildOptions);

      select.addEventListener('change', () => {
        if (rebuilding) return;
        selectOption(multiselect, select.value);
        setTimeout(syncFromOriginal, 200);
      });

      const syncFromOriginal = () => {
        if (rebuilding) return;
        const current = readSelected(multiselect);
        if (select.value === current) return;
        if (![...select.options].some(option => option.value === current)) rebuildOptions();
        select.value = current;
      };

      watchMultiselect(multiselect, syncFromOriginal);
    });
  }

  // Tinted at low alpha when idle, lit up when picked. The gradient plus the
  // inner top highlight give the chips some depth; the picked one gets a
  // halo in its own item colour, echoing the tristate icons' glow.
  function setRarityLook(button, rgb, active) {
    button.classList.toggle('is-active', active);
    if (active) {
      button.style.background =
        `linear-gradient(180deg, rgba(${rgb}, .45), rgba(${rgb}, .18))`;
      button.style.borderColor = `rgba(${rgb}, .9)`;
      button.style.color = `rgb(${rgb})`;
      button.style.boxShadow =
        `0 0 7px rgba(${rgb}, .45), inset 0 1px 0 rgba(255, 255, 255, .18)`;
      return;
    }
    button.style.background =
      `linear-gradient(180deg, rgba(${rgb}, .16), rgba(${rgb}, .05))`;
    button.style.borderColor = `rgba(${rgb}, .28)`;
    button.style.color = `rgba(${rgb}, .72)`;
    button.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, .06)';
  }

  // Item Rarity as a strip of tinted letter buttons instead of a combobox,
  // closed off by the same × the other filters use for clearing.
  function addRarityMirror(slot, config) {
    const { label, filterTitle } = config;

    const box = document.createElement('span');
    box.className = 'qf-cur';
    slot.appendChild(box);

    waitForMultiselectFilter(filterTitle, (filter) => {
      const multiselect = filter.querySelector('.multiselect');
      if (DEBUG) console.log('[QF] rarity filter ready:', filterTitle);

      // Picking a rarity means selecting its option; releasing it means
      // going back to "Any", whether that comes from the × or from clicking
      // the picked chip again.
      function choose(optionText) {
        const match = findOptionText(multiselect, optionText.toLowerCase());
        if (!match) return;
        selectOption(multiselect, match);
        setTimeout(syncRarity, 150);
        setTimeout(syncRarity, 500);
      }

      const isPicked = (rarity) =>
        readSelected(multiselect).trim().toLowerCase() === rarity.option.toLowerCase();

      function syncRarity() {
        const current = readSelected(multiselect).trim().toLowerCase();
        buttons.forEach(({ element, rarity }) => {
          setRarityLook(element, rarity.rgb, current === rarity.option.toLowerCase());
        });
        box.title = `${label}: ${readSelected(multiselect)}`;
        syncClear();
      }

      const buttons = RARITIES.map((rarity) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = rarity.struck ? 'qf-rar-btn is-struck' : 'qf-rar-btn';
        button.textContent = rarity.label;
        button.title = rarity.option;
        setRarityLook(button, rarity.rgb, false);

        // Clicking the picked chip again releases it, on top of the × below.
        button.addEventListener('click', () => {
          choose(isPicked(rarity) ? 'Any' : rarity.option);
        });

        lockElement(button);
        box.appendChild(button);
        return { element: button, rarity };
      });

      const separator = document.createElement('span');
      separator.className = 'qf-rar-sep';
      box.appendChild(separator);

      // Same semantics as the range filters' × : greyed out when there is
      // nothing to clear, and while a live search holds the filters.
      const clearButton = document.createElement('button');
      clearButton.type = 'button';
      clearButton.className = 'qf-rar-btn qf-rar-clear';
      clearButton.textContent = '×';
      clearButton.addEventListener('click', () => choose('Any'));
      box.appendChild(clearButton);

      function syncClear() {
        const active = !filtersLocked && readSelected(multiselect) !== 'Any';
        clearButton.disabled = !active;
        clearButton.title = active ? `Reset ${label}` : '';
        clearButton.style.opacity = active ? '1' : '0.35';
        clearButton.style.pointerEvents = active ? 'auto' : 'none';
      }
      registerLockable(syncClear);

      syncRarity();
      setTimeout(syncRarity, 600);
      watchMultiselect(multiselect, syncRarity);
    });
  }

  // Buyout Price: min/max fields plus currency shortcut buttons
  function addBuyoutMirror(slot, config) {
    const { label, filterTitle } = config;

    const group = document.createElement('span');
    group.className = 'qf-field';
    slot.appendChild(group);

    const currencyBox = document.createElement('span');
    currencyBox.className = 'qf-cur';
    slot.appendChild(currencyBox);

    waitForMultiselectFilter(filterTitle, (filter) => {
      const multiselect = filter.querySelector('.multiselect');
      const originals = numberInputsOf(filter);
      if (DEBUG) console.log('[QF] buyout filter ready - fields:', originals.length);

      addFieldLabel(group, label);
      addMirroredInputs(group, originals, label);

      // Only an exact match highlights a button; any other currency clears all
      function syncCurrency() {
        const current = readSelected(multiselect).trim().toLowerCase();
        currencyButtons.forEach(({ element, currency }) => {
          element.classList.toggle('is-active', current === currency.option.toLowerCase());
        });
        currencyBox.title = `${label}: ${readSelected(multiselect)}`;
      }

      const currencyButtons = CURRENCIES.map((currency) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'qf-cur-btn';
        button.title = currency.title || currency.label || currency.option;

        if (currency.icon) {
          const image = document.createElement('img');
          image.src = iconUrl(currency.icon);
          image.alt = button.title;
          button.appendChild(image);
        } else {
          button.textContent = currency.label;
        }

        button.addEventListener('click', () => {
          const match = findOptionText(multiselect, currency.option.toLowerCase());
          if (!match) return;
          selectOption(multiselect, match);
          setTimeout(syncCurrency, 150);
          setTimeout(syncCurrency, 500);
        });

        lockElement(button);
        currencyBox.appendChild(button);
        return { element: button, currency };
      });

      syncCurrency();
      setTimeout(syncCurrency, 600);
      watchMultiselect(multiselect, syncCurrency);
    });
  }

  // --- Mirrored site buttons ----------------------------------------------

  const BUTTON_BG = '#2a2a2a';
  const BUTTON_BORDER = '#4a3f2f';
  const BUTTON_ACTIVE_BG = '#3d5a3d';
  const BUTTON_ACTIVE_BORDER = '#6a9a5a';

  // Copies the original's colours. border-radius is deliberately not copied.
  function readSkin(original) {
    const computed = getComputedStyle(original);
    const background = computed.backgroundColor;
    const isTransparent = !background || background === 'transparent' ||
      /rgba\(0,\s*0,\s*0,\s*0\)/.test(background);

    return {
      background: isTransparent ? BUTTON_BG : background,
      backgroundImage: computed.backgroundImage !== 'none' ? computed.backgroundImage : '',
      color: computed.color,
      borderColor: computed.borderTopColor,
      borderWidth: computed.borderTopWidth === '0px' ? '1px' : computed.borderTopWidth,
      borderStyle: computed.borderTopStyle === 'none' ? 'solid' : computed.borderTopStyle,
      fontWeight: computed.fontWeight,
      textTransform: computed.textTransform,
      letterSpacing: computed.letterSpacing
    };
  }

  function applySkin(button, skin, radius) {
    button.style.background = skin.background;
    if (skin.backgroundImage) button.style.backgroundImage = skin.backgroundImage;
    button.style.color = skin.color;
    button.style.borderColor = skin.borderColor;
    button.style.borderWidth = skin.borderWidth;
    button.style.borderStyle = skin.borderStyle;
    button.style.fontWeight = skin.fontWeight;
    button.style.textTransform = skin.textTransform;
    button.style.letterSpacing = skin.letterSpacing;
    button.style.borderRadius = radius;
  }

  // `icon` turns the button into a square, caption-less variant that keeps
  // the original's wording as its tooltip instead. `palette` pins its
  // colours instead of deriving them from the original's active state.
  function addMirroredButton(slot, spec, fallbackCaption, options) {
    const { useSkin, icon, palette } = options || {};
    const radius = icon ? '0' : RADIUS;
    const baseBg = palette ? palette.bg : BUTTON_BG;
    const baseBorder = palette ? palette.border : BUTTON_BORDER;

    waitFor(() => findSiteButton(spec), (original) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'power-control-mirror';
      button.style.cssText =
        `cursor:pointer;border:1px solid ${baseBorder};` +
        `background:${baseBg};color:#e0d6c0;font-size:12px;` +
        `border-radius:${radius};` +
        'white-space:nowrap;line-height:1.4;font-family:inherit;' +
        'transition:filter .12s;' +
        (icon
          ? 'display:inline-flex;align-items:center;justify-content:center;' +
            `width:${CORNER_SIZE}px;height:${CORNER_SIZE}px;padding:0;`
          : 'padding:5px 14px;');
      if (icon) button.innerHTML = icon;

      const initialClasses = original.className;
      let skin = useSkin ? readSkin(original) : null;
      if (skin) applySkin(button, skin, radius);

      const sync = () => {
        const caption = captionOf(original) || fallbackCaption;
        if (icon) button.title = caption;
        else button.textContent = caption;

        if (useSkin) {
          // Re-read while the original is still on screen; it may change colour
          if (original.offsetParent !== null || original.getClientRects().length) {
            skin = readSkin(original);
          }
          applySkin(button, skin, radius);
          return;
        }
        // A pinned palette stays put; no active-state tinting.
        if (palette) return;

        const addedClasses = original.className.replace(initialClasses, '').trim();
        const childClasses = [...original.querySelectorAll('span')]
          .map(span => span.className).join(' ');
        const isActive = /active|running|live-active|stop/i.test(
          `${addedClasses} ${childClasses}`) || /stop|deactivate/i.test(captionOf(original));

        button.style.background = isActive ? BUTTON_ACTIVE_BG : BUTTON_BG;
        button.style.borderColor = isActive ? BUTTON_ACTIVE_BORDER : BUTTON_BORDER;
      };

      sync();

      // Re-running the search would only duplicate what the live search is
      // already doing; Clear, Show/Hide Filters and Live Search stay usable.
      if (spec === SITE_BUTTONS.search) lockElement(button);

      const observer = new MutationObserver(sync);
      observer.observe(original, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'style']
      });
      registerDisposer(() => observer.disconnect());

      // Live Search may only settle after a server response
      button.addEventListener('click', () => {
        // Expand groups of all filled fields, otherwise the search ignores them
        if (spec === SITE_BUTTONS.search || spec === SITE_BUTTONS.live) {
          enableGroupsForFilledFields();
        }
        original.click();
        setTimeout(sync, 60);
        setTimeout(sync, 400);
        setTimeout(sync, 1200);
      });

      slot.appendChild(button);
      if (DEBUG) console.log('[QF] mirrored button:', fallbackCaption,
        '->', original.className || original.tagName);
    }, 10000, `button:${fallbackCaption}`);
  }

  // A third-party addon slides .top-btn sideways by injecting and removing
  // a stylesheet, so there is no class or inline style of our own to key
  // off: we have to read where the button actually ended up.
  function followCornerButton(wrap) {
    let watched = null;
    let rafId = null;
    let settleUntil = 0;

    const observer = new MutationObserver(kick);

    // The button can be re-created; move the watchers along with it.
    function attach(topBtn) {
      if (topBtn === watched) return;
      observer.disconnect();
      if (watched) {
        watched.removeEventListener('transitionrun', kick);
        watched.removeEventListener('transitionstart', kick);
      }
      watched = topBtn;
      if (topBtn) {
        observer.observe(topBtn, {
          attributes: true, attributeFilter: ['style', 'class']
        });
        topBtn.addEventListener('transitionrun', kick);
        topBtn.addEventListener('transitionstart', kick);
      }
    }

    // Returns whether anything actually moved.
    function place() {
      const topBtn = document.querySelector(TOP_BUTTON_SELECTOR);
      attach(topBtn);

      // Fall back to .top-btn's own resting position if it is not there.
      let right = CORNER_GAP;
      let bottom = CORNER_GAP;
      if (topBtn) {
        const computed = getComputedStyle(topBtn);
        right = parseFloat(computed.right) || CORNER_GAP;
        bottom = parseFloat(computed.bottom) || CORNER_GAP;
      }

      // Stack on the constant height rather than the measured one, so we
      // do not jump around while .top-btn is toggled out of view.
      const nextRight = `${right}px`;
      const nextBottom = `${bottom + CORNER_SIZE + CORNER_GAP}px`;
      if (wrap.style.right === nextRight && wrap.style.bottom === nextBottom) {
        return false;
      }
      wrap.style.right = nextRight;
      wrap.style.bottom = nextBottom;
      return true;
    }

    // getComputedStyle reports the interpolated value while .top-btn is
    // mid-slide, so sampling once per frame rides its animation exactly.
    // Reading only on the triggering event would catch the pre-animation
    // value and leave us a full poll tick behind.
    function track() {
      rafId = null;
      if (place()) settleUntil = performance.now() + CORNER_SETTLE_MS;
      if (performance.now() < settleUntil) rafId = requestAnimationFrame(track);
    }

    function kick() {
      settleUntil = performance.now() + CORNER_SETTLE_MS;
      if (rafId === null) rafId = requestAnimationFrame(track);
    }

    place();
    // Backstop: the addon toggles a stylesheet, which fires no mutation on
    // .top-btn itself, so nothing above would notice that move.
    const timer = setInterval(() => { if (place()) kick(); }, POLL_MS);

    registerDisposer(() => {
      clearInterval(timer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      attach(null);
      observer.disconnect();
    });
  }

  // Extra Search button pinned to the bottom-right corner of the viewport,
  // so it stays reachable without scrolling back up.
  function addFloatingActionBar() {
    waitFor(() => document.querySelector('.search-advanced-items'), (container) => {
      if (container.querySelector('.qf-floating-actions')) return;

      const wrap = document.createElement('div');
      wrap.className = 'qf-floating-actions';
      container.appendChild(wrap);

      addMirroredButton(wrap, SITE_BUTTONS.search, 'Search',
        { icon: SEARCH_ICON_SVG, palette: CORNER_PALETTE });
      followCornerButton(wrap);
    }, 20000, 'floating-actions-container');
  }

  // --- Layout --------------------------------------------------------------

  // Clipping keeps the original focusable; display:none would break
  // selectOption(), which needs to focus the multiselect input.
  const CLIP_STYLE = {
    position: 'absolute', left: '-99999px', top: '0',
    width: '1px', height: '1px', overflow: 'hidden'
  };

  function clipControls(element, clipped) {
    if (!element) return;
    if (clipped) {
      Object.assign(element.style, CLIP_STYLE);
      if (DEBUG) console.log('[QF] clipped:', element.className);
    } else {
      for (const property of Object.keys(CLIP_STYLE)) element.style[property] = '';
    }
  }

  function mountBar(controls) {
    if (document.getElementById('qf-bar')) return null;

    const bar = document.createElement('div');
    bar.id = 'qf-bar';
    bar.className = 'power-controls';
    bar.style.cssText =
      'display:flex;flex-direction:column;align-items:stretch;' +
      'padding:8px 12px;margin:8px 0;' +
      'background:rgba(0,0,0,.9);border-radius:6px;';

    const topRow = document.createElement('div');
    topRow.className = 'qf-row';
    bar.appendChild(topRow);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'qf-row';
    bar.appendChild(bottomRow);

    const addSlot = (parent, className, extraStyle) => {
      const slot = document.createElement('div');
      slot.className = className;
      slot.style.cssText =
        'display:flex;align-items:center;gap:8px;' + (extraStyle || '');
      parent.appendChild(slot);
      return slot;
    };

    const left   = addSlot(topRow, 'qf-left');
    const center = addSlot(topRow, 'qf-center', 'flex:1 1 auto;justify-content:flex-end;gap:6px;');
    const right  = addSlot(topRow, 'qf-right');

    const fields = addSlot(bottomRow, 'qf-fields', 'gap:8px;');
    const price  = addSlot(bottomRow, 'qf-price', 'margin-left:auto;gap:8px;');

    // Sits before .search-advanced so the bar keeps its position when the
    // filter panel expands.
    const advanced = document.querySelector('.search-bar.search-advanced');
    if (advanced && advanced.parentElement) {
      advanced.parentElement.insertBefore(bar, advanced);
      if (DEBUG) console.log('[QF] bar inserted before search-advanced');
    } else {
      controls.parentElement.insertBefore(bar, controls);
      if (DEBUG) console.log('[QF] fallback: bar inserted before', controls.className);
    }

    return { bar, left, fields, center, right, price };
  }

  const isSearchTabActive = () => {
    const tab = document.querySelector('li.menu-search');
    return !!tab && tab.classList.contains('active');
  };

  // --- Bootstrap -----------------------------------------------------------

  // The site re-renders the filter fields in place when switching between
  // tabs (e.g. Search <-> Bulk Exchange) even while the outer .controls
  // container survives, detaching every original our mirrors are bound to.
  // `activeUI` tracks the bar currently mounted so we can detect that and
  // rebuild from scratch.
  let activeUI = null;

  function isMirrorUIStale() {
    if (!activeUI) {
      if (DEBUG) console.log('[QF/tab] stale check: no activeUI yet');
      return true;
    }
    if (!activeUI.controls.isConnected) {
      if (DEBUG) console.log('[QF/tab] stale check: controls container detached');
      return true;
    }
    if (!activeUI.bar.isConnected) {
      if (DEBUG) console.log('[QF/tab] stale check: our own bar detached');
      return true;
    }
    // The site can re-render the deeper filter fields (range/dropdown/
    // tristate inputs) in place while the outer .controls container
    // persists, so check those individually too.
    for (const original of trackedOriginals) {
      if (!original.isConnected) {
        if (DEBUG) console.log('[QF/tab] stale check: a tracked filter input is detached', original);
        return true;
      }
    }
    if (DEBUG) {
      console.log('[QF/tab] stale check: everything still connected',
        '(tracking', trackedOriginals.size, 'filter inputs)');
    }
    return false;
  }

  function teardownMirrorUI() {
    if (DEBUG) console.log('[QF/tab] tearing down stale mirror UI');
    // Stop every watcher first, so nothing keeps polling the nodes we
    // are about to drop.
    disposeAll();
    const oldBar = document.getElementById('qf-bar');
    if (oldBar) oldBar.remove();
    const oldFloating = document.querySelector('.qf-floating-actions');
    if (oldFloating) oldFloating.remove();
    trackedOriginals.clear();
    // The flag itself survives: a live search that is still running must
    // keep the freshly mounted controls locked.
    lockables.length = 0;
    activeUI = null;
  }

  function mountMirrorUI(controls) {
    if (DEBUG) console.log('[QF/tab] mounting mirror UI against controls:', controls);
    const slots = mountBar(controls);
    if (!slots) {
      console.warn('[QF] bar already present, skipping mount - ' +
        'the previous teardown did not remove it');
      return;
    }
    const { bar, left, fields, center, right, price } = slots;

    addMirroredButton(left, SITE_BUTTONS.live, 'Live Search', { useSkin: true });

    TRISTATE_FILTERS.forEach(config => addTristateButton(center, config));

    addMirroredButton(right, SITE_BUTTONS.clear, 'Clear', {});
    addMirroredButton(right, SITE_BUTTONS.filters, 'Show Filters', {});
    addMirroredButton(right, SITE_BUTTONS.search, 'Search', { useSkin: true });

    addRarityMirror(fields, { label: 'Rarity', filterTitle: 'Item Rarity' });

    DROPDOWN_FILTERS.forEach(config => addDropdownMirror(fields, config));
    RANGE_FILTERS.forEach(config => addRangeMirror(fields, config));

    addBuyoutMirror(price, { label: 'Buyout', filterTitle: 'Buyout Price' });

    addFloatingActionBar();
    watchLiveSearchState();

    activeUI = { bar, controls };
    if (DEBUG) console.log('[QF/tab] mount complete, activeUI set:', activeUI);
  }

  // Rebuilds the mirror UI only if the previous one went stale (its
  // originals got detached). Cheap no-op otherwise.
  function ensureMirrorUI(onReady) {
    if (!isMirrorUIStale()) {
      if (DEBUG) console.log('[QF/tab] ensureMirrorUI: not stale, skipping rebuild');
      return onReady();
    }

    if (DEBUG) console.log('[QF/tab] ensureMirrorUI: stale, rebuilding');
    teardownMirrorUI();
    waitFor(() => findControlsBar(), (controls) => {
      mountMirrorUI(controls);
      onReady();
    }, 20000, 'controls-bar');
  }

  let wasActive = null;
  const applyTabState = () => {
    const active = isSearchTabActive();
    if (DEBUG) console.log('[QF/tab] applyTabState fired: active =', active, '| wasActive =', wasActive);
    if (active === wasActive) return;
    wasActive = active;

    if (!active) {
      if (activeUI) {
        activeUI.bar.style.display = 'none';
        if (HIDE_CONTROLS) clipControls(activeUI.controls, false);
      }
      if (DEBUG) console.log('[QF] search tab active:', active);
      return;
    }

    ensureMirrorUI(() => {
      if (!activeUI) {
        console.warn('[QF/tab] ensureMirrorUI onReady but activeUI is still null');
        return;
      }
      activeUI.bar.style.display = 'flex';
      if (HIDE_CONTROLS) clipControls(activeUI.controls, true);
      if (DEBUG) console.log('[QF] search tab active:', active);
    });
  };

  ensureMirrorUI(() => {
    // Delayed so mirrored buttons can read their originals while still visible
    setTimeout(applyTabState, 1200);

    // Deliberately not registered as a disposer: this watcher is what
    // triggers a rebuild, so it has to outlive every teardown.
    const tabList = document.querySelector('ul.nav-tabs.main');
    if (DEBUG) console.log('[QF/tab] tab list element:', tabList);
    if (tabList) {
      new MutationObserver(applyTabState).observe(tabList, {
        attributes: true, attributeFilter: ['class'], subtree: true
      });
    } else {
      console.warn('[QF] tab list not found, polling instead');
      setInterval(applyTabState, 500);
    }
  });
})();
