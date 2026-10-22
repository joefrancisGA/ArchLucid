import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";
import { AUTHORITY_THEME_STORAGE_KEY, type UiAuthorityTheme } from "@/lib/ui-authority-theme";

/** Escape `<` in JSON embedded inside `<script>` to block markup breakout (CWE-094; CodeQL js/bad-code-sanitization). */
function escapeJsonForInlineScript(json: string): string {
  return json.replace(/</g, "\\u003c");
}

/** Inline pre-hydration script: applies resolved appearance before React mounts. */
export function buildColorModeBootstrapInlineScript(defaultAuthorityTheme: UiAuthorityTheme): string {
  const payload = escapeJsonForInlineScript(JSON.stringify({
    colorKey: COLOR_MODE_STORAGE_KEY,
    themeKey: AUTHORITY_THEME_STORAGE_KEY,
    defaultAuthorityTheme,
  }));

  return `(function(){try{var cfg=${payload};var raw=localStorage.getItem(cfg.colorKey);var mode='system';if(raw){var normalized=String(raw).trim().toLowerCase();if(normalized==='light'||normalized==='dark'||normalized==='system'){mode=normalized;}}var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=mode==='dark'||(mode==='system'&&!!prefersDark);document.documentElement.classList.toggle('dark',dark);var theme=localStorage.getItem(cfg.themeKey);if(theme!=='charcoal'&&theme!=='default'){theme=cfg.defaultAuthorityTheme;}document.documentElement.setAttribute('data-al-authority-theme',theme==='charcoal'?'charcoal':'default');}catch(e){}})();`;
}
