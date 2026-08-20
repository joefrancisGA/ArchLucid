"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  COLOR_MODE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE,
  type ColorModePreference,
} from "@/lib/color-mode-preference";
import { useUserAppearancePreference } from "@/lib/use-user-appearance-preference";

const THEME_OPTIONS: ReadonlyArray<{
  readonly value: ColorModePreference;
  readonly label: string;
  readonly description: string;
  readonly previewClassName: string;
}> = [
  {
    value: "system",
    label: "System",
    description: "Follow this device's appearance setting.",
    previewClassName: "bg-gradient-to-r from-white via-neutral-200 to-neutral-800",
  },
  {
    value: "light",
    label: "Light",
    description: "Always use the light appearance.",
    previewClassName: "bg-white border border-neutral-300",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark appearance.",
    previewClassName: "bg-neutral-900",
  },
];

type Props = {
  readonly helperText?: string;
};

/** Accessible radio-card theme selector backed by account preferences. */
export function ThemePreferenceSelector(props: Props) {
  const { preference, mounted, accountSyncState, setAndPersist } = useUserAppearancePreference();
  const statusText =
    accountSyncState === "local-only" ? COLOR_MODE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE : props.helperText;

  if (!mounted) {
    return <div aria-hidden="true" className="h-28 w-full" data-testid="theme-preference-loading" />;
  }

  return (
    <div className="space-y-3" data-testid="theme-preference-selector">
      <fieldset>
        <legend className="sr-only">Theme</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const selected = preference === option.value;
            const inputId = `theme-preference-${option.value}`;

            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className={cn(
                  "relative block cursor-pointer rounded-lg border p-3 transition-colors",
                  "focus-within:ring-2 focus-within:ring-teal-700 focus-within:ring-offset-2 dark:focus-within:ring-teal-500",
                  "forced-colors:border forced-colors:outline-offset-2",
                  selected
                    ? "border-teal-700 bg-teal-50/70 ring-2 ring-teal-700/30 dark:border-teal-500 dark:bg-teal-950/30 dark:ring-teal-400/30 forced-colors:outline"
                    : "border-neutral-200 bg-al-surface-raised hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600",
                )}
                data-testid={`theme-preference-option-${option.value}`}
              >
                <input
                  id={inputId}
                  type="radio"
                  name="theme-preference"
                  className="peer sr-only"
                  value={option.value}
                  checked={selected}
                  aria-label={option.label}
                  onChange={() => setAndPersist(option.value)}
                />
                {selected ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 text-teal-800 dark:text-teal-300">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>Selected</span>
                  </span>
                ) : null}
                <div
                  className={cn("mb-3 h-10 w-full rounded-md", option.previewClassName)}
                  aria-hidden="true"
                />
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{option.label}</p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{option.description}</p>
              </label>
            );
          })}
        </div>
      </fieldset>
      {statusText ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role={accountSyncState === "local-only" ? "alert" : "status"}
          data-testid="theme-preference-sync-status"
        >
          {statusText}
        </p>
      ) : null}
    </div>
  );
}
