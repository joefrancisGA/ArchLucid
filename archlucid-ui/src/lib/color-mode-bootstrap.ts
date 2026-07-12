import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";

/** Inline pre-hydration script: applies resolved appearance before React mounts. */
export function buildColorModeBootstrapInlineScript(authorityThemeEnvDefault: string): string {
  const colorKey = COLOR_MODE_STORAGE_KEY;
  const themeKey = "archlucid_authority_theme";

  // codeql[js/bad-code-sanitization] Storage keys are constants; authority theme default is deployment config, not request input.
  return `(function(){try{var colorKey=${JSON.stringify(colorKey)};var raw=localStorage.getItem(colorKey);var mode='system';if(raw){var normalized=String(raw).trim().toLowerCase();if(normalized==='light'||normalized==='dark'||normalized==='system'){mode=normalized;}}var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=mode==='dark'||(mode==='system'&&!!prefersDark);document.documentElement.classList.toggle('dark',dark);var themeKey=${JSON.stringify(themeKey)};var def=${JSON.stringify(authorityThemeEnvDefault)};var theme=localStorage.getItem(themeKey);if(theme!=='charcoal'&&theme!=='default'){theme=def;}document.documentElement.setAttribute('data-al-authority-theme',theme==='charcoal'?'charcoal':'default');}catch(e){}})();`; // codeql[js/bad-code-sanitization]
}
