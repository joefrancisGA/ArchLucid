"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState } from "react";

import {
  applyAuthorityThemeToDocument,
  buildAuthorityThemeToggleLabel,
  persistAuthorityTheme,
  readStoredAuthorityTheme,
  resolveAuthorityThemeFromEnv,
  resolveEffectiveAuthorityTheme,
  resolveNextAuthorityTheme,
  type UiAuthorityTheme,
} from "@/lib/ui-authority-theme";

const envDefault = resolveAuthorityThemeFromEnv(process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME);

/**
 * Side-by-side A/B toggle: default teal accent vs charcoal authority hierarchy.
 * Shown only when `NEXT_PUBLIC_UI_AUTHORITY_THEME_EVAL=true`.
 */
export function AuthorityThemeToggle() {
  const [theme, setTheme] = useState<UiAuthorityTheme>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredAuthorityTheme();
    const effective = resolveEffectiveAuthorityTheme(stored, envDefault);

    setMounted(true);
    setTheme(effective);
    applyAuthorityThemeToDocument(effective);
  }, []);

  const setAndPersist = useCallback((next: UiAuthorityTheme) => {
    setTheme(next);
    persistAuthorityTheme(next);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" className="h-8 w-8" />;
  }

  const nextTheme = resolveNextAuthorityTheme(theme);
  const label = buildAuthorityThemeToggleLabel(theme);
  const icon = theme === "charcoal" ? "◼" : "◆";

  return (
    <button
      type="button"
      data-testid="authority-theme-toggle"
      className={cn("auth-panel-focus flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700", OPERATOR_TYPOGRAPHY.body,
        theme === "charcoal" ? "text-neutral-100 dark:text-neutral-100" : "text-al-text-secondary dark:text-neutral-300",
      )}
      aria-label={label}
      onClick={() => setAndPersist(nextTheme)}
    >
      <span aria-hidden className={cn("font-bold leading-none", OPERATOR_TYPOGRAPHY.badge)}>
        {icon}
      </span>
    </button>
  );
}
