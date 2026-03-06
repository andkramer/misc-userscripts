// ==UserScript==
// @name         PoEDB Vaal Roll Simulator
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a Vaal Orb button to each unique item frame. Pre-calculates all values in a worker thread.
// @author       You
// @match        https://poedb.tw/us/Unique_item*
// @updateURL    https://raw.githubusercontent.com/andkramer/misc-userscripts/master/poedb_vaal_roll.user.js
// @downloadURL  https://raw.githubusercontent.com/andkramer/misc-userscripts/master/poedb_vaal_roll.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const VAAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="32" height="32">
        <defs>
            <radialGradient id="vg" cx="38%" cy="32%" r="65%">
                <stop offset="0%" stop-color="#ff6060"/>
                <stop offset="50%" stop-color="#cc0000"/>
                <stop offset="100%" stop-color="#4a0000"/>
            </radialGradient>
        </defs>
        <circle cx="18" cy="18" r="17" fill="url(#vg)" stroke="#2a0000" stroke-width="1.5"/>
        <text x="18" y="24" text-anchor="middle" font-size="16" font-weight="bold"
              fill="#ffffff" font-family="Georgia, serif">V</text>
    </svg>`;

    // Shared vaal state
    let globalVaaled = false;

    // Worker code as a blob — does all math off the main thread
    const workerCode = `
        function calcNewMin(val) { return Math.trunc(val * 0.78 + 0.5); }
        function calcNewMax(val) { return Math.trunc(val * 1.22 + 0.5); }

        function computeValue(text) {
            const rangeMatch = text.match(/^([+\\-]?\\(?)([+\\-]?[\\d.]+)\\s*([—–\\-])\\s*([+\\-]?[\\d.]+)(\\)?)$/);
            if (rangeMatch) {
                const prefix = rangeMatch[1];
                const rawMin = parseFloat(rangeMatch[2]);
                const dash   = rangeMatch[3];
                const rawMax = parseFloat(rangeMatch[4]);
                const suffix = rangeMatch[5];
                const newMin = rawMin < 0 ? calcNewMax(rawMin) : calcNewMin(rawMin);
                const newMax = rawMax < 0 ? calcNewMin(rawMax) : calcNewMax(rawMax);
                return { vaaled: prefix + newMin + dash + newMax + suffix };
            }

            const singleMatch = text.match(/^([+\\-]?\\(?)([+\\-]?[\\d.]+)(\\)?)$/);
            if (singleMatch) {
                const prefix = singleMatch[1];
                const val    = parseFloat(singleMatch[2]);
                const suffix = singleMatch[3];
                const newMin = val < 0 ? calcNewMax(val) : calcNewMin(val);
                const newMax = val < 0 ? calcNewMin(val) : calcNewMax(val);
                const result = newMin === newMax
                    ? prefix + newMin + suffix
                    : prefix + newMin + '\\u2014' + newMax + suffix;
                return { vaaled: result };
            }

            return null;
        }

        self.onmessage = function(e) {
            const results = {};
            e.data.forEach(function(item) {
                const computed = computeValue(item.text);
                if (computed) results[item.id] = computed.vaaled;
            });
            self.postMessage(results);
        };
    `;

    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl  = URL.createObjectURL(workerBlob);

    // Cache: element id -> precomputed vaaled string
    const vaaledCache = {};
    let cacheReady = false;

    function gatherAndCompute() {
        const items = [];
        document.querySelectorAll('.explicitMod .mod-value').forEach((el, i) => {
            // Assign a stable id to each element
            if (!el.dataset.vaalId) el.dataset.vaalId = 'v' + i;
            // Save original now so it's always available
            if (el.dataset.original === undefined) el.dataset.original = el.textContent;
            items.push({ id: el.dataset.vaalId, text: el.textContent.trim() });
        });

        const worker = new Worker(workerUrl);
        worker.onmessage = function(e) {
            Object.assign(vaaledCache, e.data);
            cacheReady = true;
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            // Unlock all buttons
            document.querySelectorAll('.vaal-btn, .vaal-all-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.title = btn.classList.contains('vaal-all-btn') ? 'Vaal All' : 'Simulate Vaal Orb';
            });
        };
        worker.postMessage(items);
    }

    function applyVaal(itemEl, btn) {
        if (!cacheReady) return;
        const modValues = itemEl.querySelectorAll('.explicitMod .mod-value');
        if (!modValues.length) return;

        const isVaaled = btn.dataset.vaaled === 'true';

        modValues.forEach(el => {
            if (isVaaled) {
                // Revert
                el.textContent = el.dataset.original;
            } else {
                // Apply from cache
                const cached = vaaledCache[el.dataset.vaalId];
                if (cached !== undefined) el.textContent = cached;
            }
        });

        if (isVaaled) {
            btn.dataset.vaaled = 'false';
            btn.title = 'Simulate Vaal Orb';
            btn.style.opacity = '1';
            btn.style.filter = 'none';
        } else {
            btn.dataset.vaaled = 'true';
            btn.title = 'Revert Vaal';
            btn.style.opacity = '0.55';
            btn.style.filter = 'grayscale(60%)';
        }
    }

    function addVaalButton(dFlex) {
        if (dFlex.querySelector('.vaal-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'vaal-btn';
        btn.innerHTML = VAAL_SVG;
        btn.title = 'Calculating...';
        btn.dataset.vaaled = 'false';
        btn.disabled = true;

        Object.assign(btn.style, {
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '32px',
            height: '32px',
            background: 'none',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            zIndex: '10',
            lineHeight: '0',
            opacity: '0.35',
            transition: 'opacity 0.15s, filter 0.15s',
        });

        btn.addEventListener('mouseenter', () => {
            if (btn.dataset.vaaled !== 'true') btn.style.filter = 'brightness(1.4)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.filter = btn.dataset.vaaled === 'true' ? 'grayscale(60%)' : 'none';
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyVaal(dFlex, btn);
        });

        dFlex.style.position = 'relative';
        dFlex.appendChild(btn);
    }

    function syncGlobalButtons() {
        document.querySelectorAll('.vaal-all-btn').forEach(btn => {
            btn.dataset.vaaled = globalVaaled ? 'true' : 'false';
            btn.textContent    = globalVaaled ? 'Revert All' : 'Vaal All';
            btn.style.background = globalVaaled ? '#555' : '#8b0000';
        });
    }

    function createGlobalBtn() {
        const btn = document.createElement('button');
        btn.className = 'vaal-all-btn';
        btn.textContent = 'Calculating...';
        btn.dataset.vaaled = 'false';
        btn.disabled = true;

        Object.assign(btn.style, {
            marginLeft: '12px',
            padding: '3px 12px',
            background: '#555',
            color: '#fff',
            border: '1px solid #2a0000',
            borderRadius: '4px',
            cursor: 'not-allowed',
            fontWeight: 'bold',
            fontSize: '13px',
            verticalAlign: 'middle',
            transition: 'background 0.15s',
            opacity: '0.6',
        });

        btn.addEventListener('mouseenter', () => {
            if (!btn.disabled) btn.style.background = globalVaaled ? '#666' : '#cc0000';
        });
        btn.addEventListener('mouseleave', () => {
            if (!btn.disabled) btn.style.background = globalVaaled ? '#555' : '#8b0000';
        });

        btn.addEventListener('click', () => {
            if (!cacheReady) return;
            globalVaaled = !globalVaaled;
            document.querySelectorAll('.vaal-btn').forEach(itemBtn => {
                const alreadyVaaled = itemBtn.dataset.vaaled === 'true';
                const itemEl = itemBtn.parentElement;
                if (globalVaaled && !alreadyVaaled) applyVaal(itemEl, itemBtn);
                if (!globalVaaled && alreadyVaaled) applyVaal(itemEl, itemBtn);
            });
            syncGlobalButtons();
        });

        // When cache is ready, this button gets re-enabled via gatherAndCompute unlock loop
        // but we also need to fix cursor/opacity here
        const observer = new MutationObserver(() => {
            if (!btn.disabled) {
                btn.style.cursor = 'pointer';
                btn.style.opacity = '1';
                btn.style.background = '#8b0000';
                btn.textContent = 'Vaal All';
                observer.disconnect();
            }
        });
        observer.observe(btn, { attributes: true, attributeFilter: ['disabled'] });

        return btn;
    }

    function addGlobalToggle() {
        document.querySelectorAll('.card-header').forEach(header => {
            if (header.querySelector('.vaal-all-btn')) return;
            header.appendChild(createGlobalBtn());
        });
    }

    function init() {
        document.querySelectorAll('div.col > div.d-flex').forEach(dFlex => {
            if (dFlex.querySelector('.explicitMod .mod-value')) {
                addVaalButton(dFlex);
            }
        });
        addGlobalToggle();
        // Kick off background calculation
        gatherAndCompute();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    } else {
        setTimeout(init, 500);
    }

})();
