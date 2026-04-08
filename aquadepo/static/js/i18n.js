/* ============================================================
   Aquahertz ai — i18n Translation Engine
   Supports: EN (English), AR (Arabic/RTL), FR (French)
   ============================================================ */

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'ar', 'fr'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'aquahertz_lang';

  // Get saved language or default
  function getSavedLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
  }

  // Get translation for a key
  function t(key, lang) {
    lang = lang || getSavedLang();
    const entry = window.TRANSLATIONS && window.TRANSLATIONS[key];
    if (!entry) return null;
    return entry[lang] || entry[DEFAULT_LANG] || key;
  }

  // Apply all translations to the page
  function applyTranslations(lang) {
    // 1. Text content — data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key, lang);
      if (val) el.innerHTML = val;
    });

    // 2. Placeholders — data-i18n-ph
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const val = t(key, lang);
      if (val) el.setAttribute('placeholder', val);
    });

    // 3. Page title — data-i18n-title on <html> or <body>
    const titleKey = document.documentElement.getAttribute('data-i18n-title')
                  || document.body.getAttribute('data-i18n-title');
    if (titleKey) {
      const val = t(titleKey, lang);
      if (val) document.title = val;
    }
  }

  // Set RTL/LTR direction
  function setDirection(lang) {
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', lang);
    }
  }

  // Update active state on language switcher buttons + toggle label
  const LANG_LABELS = { en: 'EN', ar: 'AR', fr: 'FR' };

  function updateSwitcherUI(lang) {
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    // Update all toggle button labels
    document.querySelectorAll('.lang-switcher-toggle').forEach(toggle => {
      const labelSpan = toggle.querySelector('span:not(.material-symbols-outlined)');
      if (labelSpan) labelSpan.textContent = LANG_LABELS[lang] || 'EN';
    });
    // Close all dropdowns
    document.querySelectorAll('.lang-switcher.open').forEach(el => el.classList.remove('open'));

    // Add Arabic font for better rendering
    if (lang === 'ar') {
      document.body.style.fontFamily = "'Inter', 'Segoe UI', 'Tahoma', 'Arial', sans-serif";
    } else {
      document.body.style.fontFamily = "";
    }
  }

  // Main: set language
  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;

    localStorage.setItem(STORAGE_KEY, lang);
    setDirection(lang);
    applyTranslations(lang);
    updateSwitcherUI(lang);
  }

  // Initialize on DOM ready
  function init() {
    const lang = getSavedLang();
    setDirection(lang);
    applyTranslations(lang);
    updateSwitcherUI(lang);

    // Bind language switcher clicks
    document.addEventListener('click', function (e) {
      const langBtn = e.target.closest('.lang-option');
      if (langBtn) {
        e.preventDefault();
        const newLang = langBtn.getAttribute('data-lang');
        if (newLang) setLanguage(newLang);
      }

      // Toggle dropdown
      const toggler = e.target.closest('.lang-switcher-toggle');
      if (toggler) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = toggler.closest('.lang-switcher');
        if (dropdown) dropdown.classList.toggle('open');
        return;
      }

      // Close dropdown on outside click
      document.querySelectorAll('.lang-switcher.open').forEach(el => {
        if (!el.contains(e.target)) el.classList.remove('open');
      });
    });
  }

  // Expose globally
  window.AquaI18n = { setLanguage, t, getSavedLang };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
