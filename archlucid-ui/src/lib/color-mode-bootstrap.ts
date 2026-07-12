import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";

function resolveAuthorityThemeDefault(authorityThemeEnvDefault: string): "charcoal" | "default" {
  if (authorityThemeEnvDefault === "charcoal" || authorityThemeEnvDefault === "default") {
    return authorityThemeEnvDefault;
  }

  return "default";
}

/** Inline pre-hydration script: applies resolved appearance before React mounts. */
export function buildColorModeBootstrapInlineScript(authorityThemeEnvDefault: string): string {
  const payload = JSON.stringify({
    colorKey: COLOR_MODE_STORAGE_KEY,
    themeKey: "archlucid_authority_theme",
    defaultAuthorityTheme: resolveAuthorityThemeDefault(authorityThemeEnvDefault),
  });

  return `(function(){try{var cfg=${payload};var raw=localStorage.getItem(cfg.colorKey);var mode='system';if(raw){var normalized=String(raw).trim().toLowerCase();if(normalized==='light'||normalized==='dark'||normalized==='system'){mode=normalized;}}var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=mode==='dark'||(mode==='system'&&!!prefersDark);document.documentElement.classList.toggle('dark',dark);var theme=localStorage.getItem(cfg.themeKey);if(theme!=='charcoal'&&theme!=='default'){theme=cfg.defaultAuthorityTheme;}document.documentElement.setAttribute('data-al-authority-theme',theme==='charcoal'?'charcoal':'default');}catch(e){}})();`;
}
