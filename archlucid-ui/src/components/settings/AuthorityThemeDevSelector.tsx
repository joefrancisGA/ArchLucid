"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  persistAuthorityTheme,
  readStoredAuthorityTheme,
  resolveAuthorityThemeFromEnv,
  resolveEffectiveAuthorityTheme,
  type UiAuthorityTheme,
} from "@/lib/ui-authority-theme";

const envDefault = resolveAuthorityThemeFromEnv(process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME);

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

/** Temporary developer control on Settings — persists to localStorage like the shell toggle. */
export function AuthorityThemeDevSelector() {
  const [theme, setTheme] = useState<UiAuthorityTheme>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredAuthorityTheme();
    const effective = resolveEffectiveAuthorityTheme(stored, envDefault);

    setMounted(true);
    setTheme(effective);
  }, []);

  const selectTheme = useCallback((next: UiAuthorityTheme) => {
    setTheme(next);
    persistAuthorityTheme(next);
  }, []);

  if (!mounted) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400" aria-hidden="true">
        Loading visual theme…
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="authority-theme-dev-selector">
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
        Preview the charcoal authority hierarchy against the default teal accent theme. Selection is
        stored in this browser only (
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">archlucid_authority_theme</code>
        ).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Visual authority theme">
        {options.map((option) => {
          const selected = theme === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? "default" : "outline"}
              data-testid={`authority-theme-option-${option.value}`}
              aria-pressed={selected}
              className={cn(
                "h-auto min-h-10 flex-1 flex-col items-start gap-1 whitespace-normal px-3 py-2 text-left",
                selected ? undefined : "bg-white dark:bg-neutral-900",
              )}
              onClick={() => selectTheme(option.value)}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span
                className={cn(
                  "text-xs font-normal",
                  selected ? "text-primary-foreground/90" : "text-neutral-600 dark:text-neutral-400",
                )}
              >
                {option.description}
              </span>
            </Button>
          );
        })}
      </div>
      <p className="m-0 text-xs text-neutral-500 dark:text-neutral-500">
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
