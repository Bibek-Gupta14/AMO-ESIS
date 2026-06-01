/**
 * =============================================================================
 * ESIS Meghalaya Government Portal — main.js
 * Vanilla JavaScript: accessibility, navigation, search, and UI interactions
 * =============================================================================
 */

'use strict';

/* ─────────────────────────────────────────────
   1. UTILITY HELPERS
───────────────────────────────────────────── */

/**
 * Safe querySelector — returns null without throwing if not found
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
const qs = (selector, context = document) => context.querySelector(selector);

/**
 * Safe querySelectorAll — always returns a live NodeList / Array
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element[]}
 */
const qsa = (selector, context = document) =>
  Array.from(context.querySelectorAll(selector));

/**
 * Debounce a function — used for search input
 * @param {Function} fn
 * @param {number} delay  milliseconds
 * @returns {Function}
 */
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/* ─────────────────────────────────────────────
   2. MOBILE NAVIGATION TOGGLE
───────────────────────────────────────────── */
const initMobileNav = () => {
  const toggle = qs('#nav-toggle');
  const navList = qs('#nav-list');

  if (!toggle || !navList) return;

  toggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close nav when a link is clicked (single-page behaviour)
  qsa('.nav-link', navList).forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Trap focus within open mobile nav for keyboard users
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navList.classList.contains('open')) {
      navList.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
};

/* ─────────────────────────────────────────────
   3.5 CONTRAST & THEME ACCESSIBILITY CONTROLS
───────────────────────────────────────────── */
const initThemeControls = () => {
  const a11yLeft = qs('.a11y-left');
  if (!a11yLeft) return;

  const themeControls = document.createElement('div');
  themeControls.className = 'theme-controls';
  themeControls.setAttribute('role', 'group');
  themeControls.setAttribute('aria-label', 'Select contrast/theme');
  
  themeControls.innerHTML = `
    <span class="a11y-separator" aria-hidden="true" style="margin: 0 var(--space-2); opacity: 0.3;">|</span>
    <span style="color:rgba(255, 255, 255, 1); font-size:11px; margin-right:4px;">Contrast:</span>
    <button class="theme-btn theme-btn-dark" data-theme="dark" aria-label="Dark Mode" aria-pressed="false">A</button>
    <button class="theme-btn theme-btn-white" data-theme="white" aria-label="White Contrast" aria-pressed="false">A</button>
    <button class="theme-btn theme-btn-normal active" data-theme="normal" aria-label="Normal Contrast" aria-pressed="true">A</button>
  `;

  const fontControls = qs('.font-controls', a11yLeft);
  if (fontControls) {
    fontControls.after(themeControls);
  } else {
    a11yLeft.appendChild(themeControls);
  }

  const root = document.documentElement;
  const buttons = qsa('.theme-btn', themeControls);

  const applyTheme = (themeName) => {
    if (themeName === 'normal') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', themeName);
    }

    buttons.forEach(btn => {
      const active = btn.dataset.theme === themeName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  };

  const savedTheme = localStorage.getItem('esis-theme') || 'normal';
  applyTheme(savedTheme);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.theme;
      applyTheme(selected);
      localStorage.setItem('esis-theme', selected);
      announceToScreenReader(`Theme changed to ${selected} mode`);
    });
  });
};


/* ─────────────────────────────────────────────
   3.6 EXTRA ACCESSIBILITY CONTROLS
   (Increase / Decrease Text, Text Spacing, Line Height, Reset)
───────────────────────────────────────────── */
const initExtraA11yControls = () => {
  const a11yLeft = qs('.a11y-left');
  if (!a11yLeft) return;

  const root = document.documentElement;

  /* ── font size step (separate from the A- / A / A+ buttons) ── */
  // Steps: 85% / 100% / 115% / 130%
  const fontSteps = [85, 100, 115, 130];
  let fontStep = parseInt(localStorage.getItem('esis-text-step') || '1', 10);

  const applyTextStep = (step) => {
    fontStep = Math.max(0, Math.min(fontSteps.length - 1, step));
    root.style.fontSize = fontSteps[fontStep] + '%';
    localStorage.setItem('esis-text-step', String(fontStep));
  };
  // Restore on load
  if (localStorage.getItem('esis-text-step') !== null) applyTextStep(fontStep);

  /* ── text-spacing toggle ── */
  let spacingOn = localStorage.getItem('esis-text-spacing') === '1';
  const applySpacing = (on) => {
    spacingOn = on;
    root.classList.toggle('a11y-text-spacing', on);
    localStorage.setItem('esis-text-spacing', on ? '1' : '0');
  };
  if (spacingOn) applySpacing(true);

  /* ── line-height toggle ── */
  let lineOn = localStorage.getItem('esis-line-height') === '1';
  const applyLineHeight = (on) => {
    lineOn = on;
    root.classList.toggle('a11y-line-height', on);
    localStorage.setItem('esis-line-height', on ? '1' : '0');
  };
  if (lineOn) applyLineHeight(true);

  /* ── build & inject the control strip ── */
  const strip = document.createElement('div');
  strip.className = 'a11y-extra-controls';
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', 'Extra text accessibility controls');

  strip.innerHTML = `
    <span class="a11y-separator" aria-hidden="true" style="margin:0 4px;opacity:0.3">|</span>

    <!-- Increase Text -->
    <button class="a11y-extra-btn" id="a11y-text-inc" aria-label="Increase text size" title="Increase Text">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 17.59L7.41 19 12 14.42 16.59 19 18 17.59l-6-6z"/>
        <path d="M6 11l1.41 1.41L12 7.83l4.59 4.58L18 11l-6-6z"/>
      </svg>
      <span>Text ↑</span>
    </button>

    <!-- Decrease Text -->
    <button class="a11y-extra-btn" id="a11y-text-dec" aria-label="Decrease text size" title="Decrease Text">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18 6.41L16.59 5 12 9.58 7.41 5 6 6.41l6 6z"/>
        <path d="M18 13l-1.41-1.41L12 16.17l-4.59-4.58L6 13l6 6z"/>
      </svg>
      <span>Text ↓</span>
    </button>

    <!-- Text Spacing -->
    <button class="a11y-extra-btn" id="a11y-spacing" aria-label="Toggle text spacing" aria-pressed="false" title="Text Spacing">
      <svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
        <path d="M920 416H616c-4.4 0-8 3.6-8 8v112c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-56h60v320h-46c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h164c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8h-46V480h60v56c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V424c0-4.4-3.6-8-8-8zM656 296V168c0-4.4-3.6-8-8-8H104c-4.4 0-8 3.6-8 8v128c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-64h168v560h-92c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h264c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8h-92V232h168v64c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8z"/>
      </svg>
      <span>Text Spacing</span>
    </button>

    <!-- Line Height -->
    <button class="a11y-extra-btn" id="a11y-lineheight" aria-label="Toggle line height" aria-pressed="false" title="Line Height">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 4H21V6H11V4ZM6 7V11H4V7H1L5 3L9 7H6ZM6 17H9L5 21L1 17H4V13H6V17ZM11 18H21V20H11V18ZM9 11H21V13H9V11Z"/>
      </svg>
      <span>Line Height</span>
    </button>

    <!-- Reset -->
    <button class="a11y-extra-btn" id="a11y-reset" aria-label="Reset text settings" title="Reset Text">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M20 8C18.6 5 15.5 3 12 3 7 3 3 7 3 12s4 9 9 9 9-4 9-9M21 3v6h-6"/>
      </svg>
      <span>Reset</span>
    </button>
  `;

  // Inject after theme-controls (or at end of a11y-left)
  const themeControls = qs('.theme-controls', a11yLeft);
  if (themeControls) {
    themeControls.after(strip);
  } else {
    a11yLeft.appendChild(strip);
  }

  /* ── wire up buttons ── */
  const btnInc  = qs('#a11y-text-inc', strip);
  const btnDec  = qs('#a11y-text-dec', strip);
  const btnSpacing = qs('#a11y-spacing', strip);
  const btnLine    = qs('#a11y-lineheight', strip);
  const btnReset   = qs('#a11y-reset', strip);

  const refreshSpacingBtn = () => {
    btnSpacing.classList.toggle('active', spacingOn);
    btnSpacing.setAttribute('aria-pressed', String(spacingOn));
  };
  const refreshLineBtn = () => {
    btnLine.classList.toggle('active', lineOn);
    btnLine.setAttribute('aria-pressed', String(lineOn));
  };
  refreshSpacingBtn();
  refreshLineBtn();

  btnInc.addEventListener('click', () => {
    applyTextStep(fontStep + 1);
    announceToScreenReader('Text size increased');
  });
  btnDec.addEventListener('click', () => {
    applyTextStep(fontStep - 1);
    announceToScreenReader('Text size decreased');
  });
  btnSpacing.addEventListener('click', () => {
    applySpacing(!spacingOn);
    refreshSpacingBtn();
    announceToScreenReader(spacingOn ? 'Text spacing enabled' : 'Text spacing disabled');
  });
  btnLine.addEventListener('click', () => {
    applyLineHeight(!lineOn);
    refreshLineBtn();
    announceToScreenReader(lineOn ? 'Line height increased' : 'Line height reset');
  });
  btnReset.addEventListener('click', () => {
    applyTextStep(1);
    applySpacing(false);
    applyLineHeight(false);
    refreshSpacingBtn();
    refreshLineBtn();
    announceToScreenReader('Text settings reset to default');
  });
};

/* ─────────────────────────────────────────────
   4. LANGUAGE SELECTOR
───────────────────────────────────────────── */
const initLanguageSelector = () => {
  qsa('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const lang = btn.dataset.lang;
      document.documentElement.setAttribute('lang', lang);
      announceToScreenReader(`Language changed to ${btn.textContent.trim()}`);
    });
  });
};

/* ─────────────────────────────────────────────
   5. HOSPITAL SEARCH & FILTER
───────────────────────────────────────────── */
const initHospitalSearch = () => {
  const searchInput = qs('#hospital-search');
  const filterSelect = qs('#hospital-filter');
  const tableBody = qs('#hospitals-tbody');

  if (!searchInput || !tableBody) return;

  const rows = qsa('tr[data-hospital]', tableBody);

  /**
   * Filter rows based on search query and location filter
   */
  const filterHospitals = () => {
    const query = searchInput.value.trim().toLowerCase();
    const filterVal = filterSelect ? filterSelect.value.toLowerCase() : '';

    let visibleCount = 0;

    rows.forEach(row => {
      const name = (row.dataset.hospital || '').toLowerCase();
      const location = (row.dataset.location || '').toLowerCase();

      const matchesSearch = !query || name.includes(query) || location.includes(query);
      const matchesFilter = !filterVal || location === filterVal;

      const show = matchesSearch && matchesFilter;
      row.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Show / hide "no results" message
    const noResults = qs('#no-results-row');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? '' : 'none';
    }

    // Update result count for screen readers
    const countEl = qs('#hospital-count');
    if (countEl) {
      countEl.textContent = `${visibleCount} hospital${visibleCount !== 1 ? 's' : ''} found`;
    }
  };

  searchInput.addEventListener('input', debounce(filterHospitals, 250));

  if (filterSelect) {
    filterSelect.addEventListener('change', filterHospitals);
  }

  // Clear search with Escape key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      if (filterSelect) filterSelect.value = '';
      filterHospitals();
    }
  });
};

/* ─────────────────────────────────────────────
   7. BACK-TO-TOP BUTTON
───────────────────────────────────────────── */
const initBackToTop = () => {
  const btn = qs('#back-to-top');
  if (!btn) return;

  const toggleVisibility = () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Move focus to the top for keyboard users
    const skipLink = qs('.skip-link');
    if (skipLink) skipLink.focus();
  });
};

/* ─────────────────────────────────────────────
   8. ACTIVE NAV LINK (based on scroll position)
───────────────────────────────────────────── */
const initActiveNav = () => {
  const navLinks = qsa('.nav-link[href^="#"]');
  if (navLinks.length === 0) return;

  const sections = navLinks
    .map(link => qs(link.getAttribute('href')))
    .filter(Boolean);

  const setActive = () => {
    const a11yHeight = qs('.accessibility-bar')?.offsetHeight || 0;
    const navHeight = qs('.main-nav')?.offsetHeight || 60;
    const scrollPos = window.scrollY + navHeight + a11yHeight + 16;

    let activeSection = null;
    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        activeSection = section;
      }
    });

    navLinks.forEach(link => {
      const isActive = activeSection &&
        link.getAttribute('href') === `#${activeSection.id}`;
      link.classList.toggle('active', !!isActive);
    });
  };

  window.addEventListener('scroll', debounce(setActive, 50), { passive: true });
};

/* ─────────────────────────────────────────────
   9. KEYBOARD ACCESSIBILITY — SIDEBAR
───────────────────────────────────────────── */
const initSidebarA11y = () => {
  const sidebarLinks = qsa('.sidebar-nav-link');

  sidebarLinks.forEach((link, index) => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = sidebarLinks[index + 1];
        if (next) next.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = sidebarLinks[index - 1];
        if (prev) prev.focus();
      }
    });
  });
};

/* ─────────────────────────────────────────────
   10. SCREEN READER ANNOUNCEMENTS
───────────────────────────────────────────── */

/**
 * Announce a message to screen readers using a live region
 * @param {string} message
 * @param {'polite'|'assertive'} [priority='polite']
 */
const announceToScreenReader = (message, priority = 'polite') => {
  let liveRegion = qs('#sr-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = ''; // Clear first to re-trigger announcement
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
};

/* ─────────────────────────────────────────────
   11. SMOOTH ANCHOR SCROLLING
───────────────────────────────────────────── */
const initSmoothScroll = () => {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = qs(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const a11yHeight = qs('.accessibility-bar')?.offsetHeight || 0;
      const navHeight = qs('.main-nav')?.offsetHeight || 60;
      const totalNavHeight = navHeight + a11yHeight;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - totalNavHeight - 16;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });

      // Set focus on target for keyboard users
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
};

/* ─────────────────────────────────────────────
   12. STATS COUNTER ANIMATION
───────────────────────────────────────────── */
const initStatsAnimation = () => {
  const statValues = qsa('.stat-value[data-target]');
  if (statValues.length === 0) return;

  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = `${prefix}${current.toLocaleString('en-IN')}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  // Use IntersectionObserver to trigger animation when visible
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statValues.forEach(el => observer.observe(el));
  } else {
    // Fallback: set values immediately
    statValues.forEach(el => {
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      el.textContent = `${prefix}${Number(el.dataset.target).toLocaleString('en-IN')}${suffix}`;
    });
  }
};

/* ─────────────────────────────────────────────
   13. HOSPITAL DATA — easily updatable
───────────────────────────────────────────── */

/**
 * Hospital data array — update this list to manage hospital entries.
 * Each entry: { name, location }
 */
const HOSPITAL_DATA = [
  { name: 'ILS Hospital, Agartala, Capital Complex Extension, PO - New Secretariat', location: 'Agartala' },
  { name: 'Narayana Super Specialty Hospital, Near Tularam Bafna Civil Hospital Campus', location: 'Guwahati' },
  { name: 'Downtown Hospital Ltd.', location: 'Guwahati' },
  { name: 'Hayat Hospital, Odalbakra, Lalganesh', location: 'Guwahati' },
  { name: 'Central Nursing Home, Survey, Basistha Road', location: 'Guwahati' },
  { name: 'Agile Hospital Pvt. Ltd., Beltola, Tripura Road', location: 'Guwahati' },
  { name: 'Sanjeevani Diagnostics & Hospitals', location: 'Guwahati' },
  { name: 'Srimanta Sankardev Hospital & Research Institute', location: 'Guwahati' },
  { name: 'Thyrocare Technologies Ltd', location: 'Navi Mumbai' },
  { name: 'Shillong Civil Hospital, Lachaumiere', location: 'Shillong' },
  { name: 'Woodlands Hospital & Medical Research Centre', location: 'Shillong' },
  { name: 'Ganesh Das Hospital, Pasteur Hill', location: 'Shillong' },
  { name: 'NEIGRIHMS, Mawdiangdiang', location: 'Shillong' },
  { name: 'Bethany Hospital, Jhalupara', location: 'Shillong' },
  { name: 'Winsome Hospital & Research Centre', location: 'Byrnihat' },
  { name: 'Greenvalley Hospital', location: 'Tura' },
  { name: 'Tura Civil Hospital', location: 'Tura' },
];

/**
 * Populate the hospital table from JS data.
 * This makes it easy to update without touching HTML.
 */
const populateHospitals = () => {
  const tbody = qs('#hospitals-tbody');
  const filterSelect = qs('#hospital-filter');

  if (!tbody) return;

  // Collect unique locations for filter dropdown
  const locations = [...new Set(HOSPITAL_DATA.map(h => h.location))].sort();

  if (filterSelect) {
    locations.forEach(loc => {
      const option = document.createElement('option');
      option.value = loc.toLowerCase();
      option.textContent = loc;
      filterSelect.appendChild(option);
    });
  }

  // Render rows
  HOSPITAL_DATA.forEach((hospital, index) => {
    const tr = document.createElement('tr');
    tr.dataset.hospital = hospital.name.toLowerCase();
    tr.dataset.location = hospital.location.toLowerCase();

    tr.innerHTML = `
      <td class="hospital-num" data-label="#">${index + 1}</td>
      <td data-label="Hospital Name">${escapeHtml(hospital.name)}</td>
      <td data-label="Location">
        <span class="hospital-location">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          ${escapeHtml(hospital.location)}
        </span>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Add "no results" row (hidden by default)
  const noResultsTr = document.createElement('tr');
  noResultsTr.id = 'no-results-row';
  noResultsTr.style.display = 'none';
  noResultsTr.innerHTML = `
    <td colspan="3" class="no-results">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
           width="32" height="32" style="margin: 0 auto var(--space-3); display:block; opacity:0.4">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      No hospitals found matching your search.
    </td>
  `;
  tbody.appendChild(noResultsTr);
};

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
const escapeHtml = (str) =>
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#039;');

/* ─────────────────────────────────────────────
   14. CURRENT YEAR FOR FOOTER COPYRIGHT
───────────────────────────────────────────── */
const setCurrentYear = () => {
  const yearEl = qs('#copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

/* ─────────────────────────────────────────────
   15. LAST UPDATED DATE
───────────────────────────────────────────── */
const setLastUpdated = () => {
  const lastMod = document.lastModified ? new Date(document.lastModified) : new Date();
  
  // Format 1 (Breadcrumb): DD MMM YYYY (e.g. 25 May 2026)
  const elBreadcrumb = qs('#last-updated-date');
  if (elBreadcrumb) {
    elBreadcrumb.textContent = lastMod.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  
  // Format 2 (Footer): Month DD, YYYY (e.g. May 25, 2026)
  const elFooter = qs('#footer-last-updated-date');
  if (elFooter) {
    elFooter.textContent = lastMod.toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
};

/* ─────────────────────────────────────────────
   16. NOTICES SECTION — toggle "see all"
───────────────────────────────────────────── */
const initNoticesToggle = () => {
  const btn = qs('#show-all-notices');
  const notices = qsa('.notice-item.hidden-notice');

  if (!btn || notices.length === 0) return;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    notices.forEach(n => n.classList.toggle('hidden-notice', expanded));
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.textContent = expanded ? 'View All Notices' : 'Show Fewer Notices';
  });
};

/* ─────────────────────────────────────────────
   17. STICKY HEADER SHADOW on scroll
───────────────────────────────────────────── */
const initNavShadow = () => {
  const nav = qs('.main-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10
      ? '0 2px 12px rgba(0,0,0,0.25)'
      : '0 2px 8px rgba(0,0,0,0.2)';
  }, { passive: true });
};

/* ─────────────────────────────────────────────
   INIT — Run all modules on DOMContentLoaded
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Data population first (needed before search init)
  populateHospitals();

  // UI modules
  initMobileNav();

  initThemeControls();
  initExtraA11yControls();
  initLanguageSelector();
  initHospitalSearch();

  initBackToTop();
  initActiveNav();
  initSidebarA11y();
  initSmoothScroll();
  initStatsAnimation();
  initNoticesToggle();
  initNavShadow();

  // Metadata
  setCurrentYear();
  setLastUpdated();

  console.info('[ESIS Portal] All modules initialized ✓');
});
