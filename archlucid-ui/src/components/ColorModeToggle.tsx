"use client";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  buildColorModeToggleLabel,
  resolveDarkAppearance,
  resolveNextColorModePreference,
  type ColorModePreference,
} from "@/lib/color-mode-preference";
import { useUserAppearancePreference } from "@/lib/use-user-appearance-preference";

export type { ColorModePreference };

export {
  buildColorModeToggleLabel,
  resolveDarkAppearance,
  resolveNextColorModePreference,
};

/**
 * Light / dark / system toggle. Persists to localStorage immediately and syncs to the user preferences API when available.
 */
export function ColorModeToggle() {
  const { preference, systemPrefersDark, mounted, setAndPersist } = useUserAppearancePreference();

  if (!mounted) {
    return <div aria-hidden="true" className="h-8 w-8" />;
  }

  const resolvedDark = resolveDarkAppearance(preference, systemPrefersDark);
  const nextMode = resolveNextColorModePreference(preference, systemPrefersDark);
  const label = buildColorModeToggleLabel(preference, systemPrefersDark);
  const Icon = resolvedDark ? Moon : Sun;
  const chromeDescription =
    "Durable account theme lives under Preferences appearance.";

  return (
    <button
      type="button"
      className={cn("auth-panel-focus flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700", OPERATOR_TYPOGRAPHY.body,
      )}
      aria-label={`${label}. ${chromeDescription}`}
      onClick={() => setAndPersist(nextMode)}
    >
      <Icon className="size-4 shrink-0 text-neutral-700 dark:text-neutral-200" aria-hidden />
    </button>
  );
}
