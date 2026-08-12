"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import {
  clearStoredAuthorityTheme,
  hasStoredAuthorityThemeOverride,
  persistAuthorityTheme,
  readStoredAuthorityTheme,
  resolveAuthorityThemeFromEnv,
  resolveEffectiveAuthorityTheme,
  type UiAuthorityTheme,
} from "@/lib/ui-authority-theme";

const envDefault = resolveAuthorityThemeFromEnv(process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME);

/** Distinguishes selected theme cards in tests and theme-selector contrast checks. */
export const AUTHORITY_THEME_OPTION_SELECTED_CLASS = "authority-theme-option-selected";

const options: { value: UiAuthorityTheme; label: string; description: string }[] = [
  {
    value: "default",
    label: "Teal accent (default)",
    description: "Carbon-style teal interactive accents and primary actions.",
  },
  {
    value: "charcoal",
    label: "Charcoal authority",
    description: "Neutral gray hierarchy for A/B evaluation of authority surfaces.",
  },
];

function optionIndexForTheme(theme: UiAuthorityTheme): number {
  const index = options.findIndex((option) => option.value === theme);

  return index >= 0 ? index : 0;
}

/** Temporary developer control on Settings — persists to localStorage like the shell toggle. */
export function AuthorityThemeDevSelector() {
  const [theme, setTheme] = useState<UiAuthorityTheme>("default");
  const [hasOverride, setHasOverride] = useState(false);
  const [mounted, setMounted] = useState(false);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const syncFromStorage = useCallback(() => {
    const stored = readStoredAuthorityTheme();
    const effective = resolveEffectiveAuthorityTheme(stored, envDefault);

    setTheme(effective);
    setHasOverride(hasStoredAuthorityThemeOverride());
  }, []);

  useEffect(() => {
    syncFromStorage();
    setMounted(true);
  }, [syncFromStorage]);

  const selectTheme = useCallback((next: UiAuthorityTheme) => {
    setTheme(next);
    persistAuthorityTheme(next);
    setHasOverride(true);
  }, []);

  const resetToBuildDefault = useCallback(() => {
    clearStoredAuthorityTheme(envDefault);
    setTheme(envDefault);
    setHasOverride(false);
  }, []);

  const focusOption = useCallback((index: number) => {
    optionRefs.current[index]?.focus();
  }, []);

  const handleOptionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, index: number) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        selectTheme(options[index].value);

        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = (index + 1) % options.length;

        focusOption(nextIndex);

        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = (index - 1 + options.length) % options.length;

        focusOption(nextIndex);
      }
    },
    [focusOption, selectTheme],
  );

  if (!mounted) {
    return (
      <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-hidden="true">
        Loading visual theme…
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="authority-theme-dev-selector">
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag
          kind={hasOverride ? "in-progress" : "ready"}
          label={hasOverride ? "Local override" : "Build default"}
          data-testid="authority-theme-override-status"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasOverride}
          data-testid="authority-theme-reset"
          onClick={resetToBuildDefault}
        >
          Reset to build default
        </Button>
      </div>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Preview the charcoal authority hierarchy against the default teal accent theme. Selection is
        stored in this browser only (
        <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>archlucid_authority_theme</code>
        ).
      </p>
      <div
        className="flex flex-col gap-2 sm:flex-row"
        role="radiogroup"
        aria-label="Visual authority theme"
      >
        {options.map((option, index) => {
          const selected = theme === option.value;

          return (
            <div
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-testid={`authority-theme-option-${option.value}`}
              className={cn(
                "min-h-10 flex-1 cursor-pointer rounded-md border px-3 py-2 text-left outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
                selected
                  ? cn(DESIGN_TOKENS.table.rowSelected, AUTHORITY_THEME_OPTION_SELECTED_CLASS)
                  : "border-neutral-200 bg-white hover:bg-[var(--al-layer-hover)] dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800/80",
              )}
              onClick={() => selectTheme(option.value)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>{option.label}</span>
              <span
                className={cn(
                  "font-normal text-neutral-600 dark:text-neutral-400",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                {option.description}
              </span>
            </div>
          );
        })}
      </div>
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
        Build default when no override is set:{" "}
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{envDefault}</span>
        {" · "}
        Shell icon toggle appears when{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">
          NEXT_PUBLIC_UI_AUTHORITY_THEME_EVAL=true
        </code>
        .
      </p>
    </div>
  );
}
