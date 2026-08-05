// ==UserScript==
// @name         PoE Trade Quick Filters
// @namespace    poe-trade-qf
// @version      4.1
// @description  Compact mirror bar for the PoE trade search filters
// @match        https://www.pathofexile.com/trade/search/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://github.com/andkramer/misc-userscripts/raw/refs/heads/master/pathofexile.com_easy-trade.meta.js
// @downloadURL  https://github.com/andkramer/misc-userscripts/raw/refs/heads/master/pathofexile.com_easy-trade.user.js
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = false;
  const ICON_SIZE = 30;
  const HIDE_CONTROLS = true;   // clip the site's own controls bar
  const RADIUS = '4px';
  const SLOW_SELECT = false;   // step through selectOption with visible delays
  const STEP_MS = 1500;        // pause between steps when SLOW_SELECT is on

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

  const DROPDOWN_FILTERS = [
    { label: 'Rarity',   filterTitle: 'Item Rarity' }
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
      #qf-bar .power-control-btn { border-radius: ${RADIUS}; }
      #qf-bar .power-control-btn:hover { background: rgba(255,255,255,.06); }
      #qf-bar .power-control-mirror:hover { filter: brightness(1.15); }
    `;
    (document.head || document.documentElement).appendChild(style);
  })();

  // --- DOM helpers ---------------------------------------------------------

  // Resolves once test() returns something truthy, then stops observing.
  function waitFor(test, onFound, timeout = 20000) {
    const immediate = test();
    if (immediate) return onFound(immediate);

    const observer = new MutationObserver(() => {
      const found = test();
      if (!found) return;
      observer.disconnect();
      clearTimeout(timer);
      onFound(found);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      console.warn('[QF] timed out waiting for element');
    }, timeout);
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
    if (direct && direct.id !== 'qf-bar') return direct;

    const liveButton = findSiteButton(SITE_BUTTONS.live);
    if (liveButton) {
      const container = liveButton.closest('.controls') || liveButton.parentElement;
      if (container && container.id !== 'qf-bar') return container;
    }
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

    waitFor(() => {
      const filter = findFilterByTitle(filterTitle);
      return filter && filter.querySelector('.multiselect') ? filter : null;
    }, (filter) => {
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

      // Pick up external changes: Clear button, URL load, original combobox
      new MutationObserver(render).observe(multiselect, {
        attributes: true, subtree: true, attributeFilter: ['class']
      });
      setInterval(render, 1000);

      holder.appendChild(button);
    });
  }

  // Two-way binding between a mirrored input and its original
  function bindInput(copy, original) {
    let writing = false;

    const pushToOriginal = () => {
      writing = true;
      if (copy.value !== '') enableGroupFor(original);
      setInputValue(original, copy.value);
      setTimeout(() => { writing = false; }, 60);
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
      if (copy.value !== original.value) copy.value = original.value || '';
    };

    new MutationObserver(pullFromOriginal).observe(original, {
      attributes: true, attributeFilter: ['value']
    });
    original.addEventListener('input', pullFromOriginal);
    original.addEventListener('change', pullFromOriginal);
    // Vue writes .value without touching the attribute, so poll as well
    setInterval(pullFromOriginal, 1000);

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
    button.title = `Reset ${label}`;
    button.addEventListener('click', () => {
      entries.forEach(({ copy, push }) => { copy.value = ''; push(); });
    });
    return button;
  }

  function addRangeMirror(slot, config) {
    const { label, filterTitle } = config;

    const group = document.createElement('span');
    group.className = 'qf-field';
    slot.appendChild(group);

    waitFor(() => {
      const filter = findFilterByTitle(filterTitle);
      if (!filter) return null;
      const inputs = [...filter.querySelectorAll('input.minmax, input[type="number"]')];
      return inputs.length ? inputs : null;
    }, (originals) => {
      if (DEBUG) console.log('[QF] range filter ready:', filterTitle,
        '- fields:', originals.length);

      const labelEl = document.createElement('span');
      labelEl.className = 'qf-field-label';
      labelEl.textContent = label;
      group.appendChild(labelEl);

      const inputWrap = document.createElement('span');
      inputWrap.className = 'qf-inputs';
      group.appendChild(inputWrap);

      const entries = originals.map((original) => {
        const copy = createMirroredInput(original);
        const push = bindInput(copy, original);
        inputWrap.appendChild(copy);
        return { copy, push };
      });

      group.appendChild(createResetButton(label, entries));
    });
  }

  function addDropdownMirror(slot, config) {
    const { label, filterTitle } = config;

    const group = document.createElement('span');
    group.className = 'qf-field';
    slot.appendChild(group);

    waitFor(() => {
      const filter = findFilterByTitle(filterTitle);
      return filter && filter.querySelector('.multiselect') ? filter : null;
    }, (filter) => {
      const multiselect = filter.querySelector('.multiselect');
      if (DEBUG) console.log('[QF] dropdown filter ready:', filterTitle);

      const labelEl = document.createElement('span');
      labelEl.className = 'qf-field-label';
      labelEl.textContent = label;
      group.appendChild(labelEl);

      const select = document.createElement('select');
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

      new MutationObserver(syncFromOriginal).observe(multiselect, {
        attributes: true, subtree: true, attributeFilter: ['class']
      });
      setInterval(syncFromOriginal, 1000);
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

    waitFor(() => {
      const filter = findFilterByTitle(filterTitle);
      return filter && filter.querySelector('.multiselect') ? filter : null;
    }, (filter) => {
      const multiselect = filter.querySelector('.multiselect');
      const originals = [...filter.querySelectorAll('input.minmax, input[type="number"]')];
      if (DEBUG) console.log('[QF] buyout filter ready - fields:', originals.length);

      const labelEl = document.createElement('span');
      labelEl.className = 'qf-field-label';
      labelEl.textContent = label;
      group.appendChild(labelEl);

      const inputWrap = document.createElement('span');
      inputWrap.className = 'qf-inputs';
      group.appendChild(inputWrap);

      const entries = originals.map((original) => {
        const copy = createMirroredInput(original);
        const push = bindInput(copy, original);
        inputWrap.appendChild(copy);
        return { copy, push };
      });

      group.appendChild(createResetButton(label, entries));

      // Only an exact match highlights a button; any other currency clears all
      function syncCurrency() {
        const current = readSelected(multiselect).trim().toLowerCase();
        currencyButtons.forEach(({ element, currency }) => {
          element.classList.toggle('is-active', current === currency.option.toLowerCase());
        });
        currencyBox.title = `${label}: ${readSelected(multiselect)}`;
      }

      // vue-multiselect renders its options lazily; focusing the input
      // forces the list into the DOM so we can match against it.
      function findOptionText(wanted) {
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
          console.warn('[QF] currency option not found:', wanted, '- available:', texts);
        }
        return match || null;
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
          const match = findOptionText(currency.option.toLowerCase());
          if (!match) return;
          selectOption(multiselect, match);
          setTimeout(syncCurrency, 150);
          setTimeout(syncCurrency, 500);
        });

        currencyBox.appendChild(button);
        return { element: button, currency };
      });

      syncCurrency();
      setTimeout(syncCurrency, 600);
      new MutationObserver(syncCurrency).observe(multiselect, {
        attributes: true, subtree: true, attributeFilter: ['class']
      });
      setInterval(syncCurrency, 1000);
    });
  }

  // --- Mirrored site buttons ----------------------------------------------

  // Copies the original's colours. border-radius is deliberately not copied.
  function readSkin(original) {
    const computed = getComputedStyle(original);
    const background = computed.backgroundColor;
    const isTransparent = !background || background === 'transparent' ||
      /rgba\(0,\s*0,\s*0,\s*0\)/.test(background);

    return {
      background: isTransparent ? '#2a2a2a' : background,
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

  function applySkin(button, skin) {
    button.style.background = skin.background;
    if (skin.backgroundImage) button.style.backgroundImage = skin.backgroundImage;
    button.style.color = skin.color;
    button.style.borderColor = skin.borderColor;
    button.style.borderWidth = skin.borderWidth;
    button.style.borderStyle = skin.borderStyle;
    button.style.fontWeight = skin.fontWeight;
    button.style.textTransform = skin.textTransform;
    button.style.letterSpacing = skin.letterSpacing;
    button.style.borderRadius = RADIUS;
  }

  function addMirroredButton(slot, spec, fallbackCaption, options) {
    const { accent, useSkin } = options || {};

    waitFor(() => findSiteButton(spec), (original) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'power-control-mirror';
      button.style.cssText =
        'padding:5px 14px;cursor:pointer;border:1px solid ' +
        (accent || '#4a3f2f') + ';' +
        'background:#2a2a2a;color:#e0d6c0;font-size:12px;' +
        `border-radius:${RADIUS};` +
        'white-space:nowrap;line-height:1.4;font-family:inherit;' +
        'transition:filter .12s;';

      const initialClasses = original.className;
      let skin = useSkin ? readSkin(original) : null;
      if (skin) applySkin(button, skin);

      const sync = () => {
        button.textContent = captionOf(original) || fallbackCaption;

        if (useSkin) {
          // Re-read while the original is still on screen; it may change colour
          if (original.offsetParent !== null || original.getClientRects().length) {
            skin = readSkin(original);
          }
          applySkin(button, skin);
          return;
        }

        const addedClasses = original.className.replace(initialClasses, '').trim();
        const childClasses = [...original.querySelectorAll('span')]
          .map(span => span.className).join(' ');
        const isActive = /active|running|live-active|stop/i.test(
          `${addedClasses} ${childClasses}`) || /stop|deactivate/i.test(captionOf(original));

        button.style.background = isActive ? '#3d5a3d' : '#2a2a2a';
        button.style.borderColor = isActive ? '#6a9a5a' : (accent || '#4a3f2f');
      };

      sync();

      new MutationObserver(sync).observe(original, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'style']
      });

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
    }, 10000);
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

  waitFor(() => findControlsBar(), (controls) => {
    const slots = mountBar(controls);
    if (!slots) return console.warn('[QF] could not insert bar');
    const { bar, left, fields, center, right, price } = slots;

    addMirroredButton(left, SITE_BUTTONS.live, 'Live Search', { useSkin: true });

    TRISTATE_FILTERS.forEach(config => addTristateButton(center, config));

    addMirroredButton(right, SITE_BUTTONS.clear, 'Clear', {});
    addMirroredButton(right, SITE_BUTTONS.filters, 'Show Filters', {});
    addMirroredButton(right, SITE_BUTTONS.search, 'Search', { useSkin: true });

    DROPDOWN_FILTERS.forEach(config => addDropdownMirror(fields, config));
    RANGE_FILTERS.forEach(config => addRangeMirror(fields, config));

    addBuyoutMirror(price, { label: 'Buyout', filterTitle: 'Buyout Price' });

    let wasActive = null;
    const applyTabState = () => {
      const active = isSearchTabActive();
      if (active === wasActive) return;
      wasActive = active;

      bar.style.display = active ? 'flex' : 'none';
      if (HIDE_CONTROLS) clipControls(controls, active);
      if (DEBUG) console.log('[QF] search tab active:', active);
    };

    // Delayed so mirrored buttons can read their originals while still visible
    setTimeout(applyTabState, 1200);

    const tabList = document.querySelector('ul.nav-tabs.main');
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
