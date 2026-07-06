"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { type ColorModePreference } from "@/lib/color-mode-preference";
import { useUserAppearancePreference } from "@/lib/use-user-appearance-preference";

const COLOR_MODE_OPTIONS: ReadonlyArray<{ value: ColorModePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Labeled light / dark / system control for Settings and other preference surfaces. */
export function ColorModeSegmentedControl() {
  const { preference, mounted, setAndPersist } = useUserAppearancePreference();

  if (!mounted) {
    return <div aria-hidden="true" className="h-9 w-full max-w-xs" data-testid="color-mode-segmented-loading" />;
  }

  return (
    <div className="space-y-2" data-testid="color-mode-segmented-control">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Color mode">
        {COLOR_MODE_OPTIONS.map((option) => {
          const selected = preference === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={selected ? "primary" : "outline"}
              data-testid={`color-mode-option-${option.value}`}
              aria-pressed={selected}
              onClick={() => setAndPersist(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        System follows your device setting.
      </p>
    </div>
  );
}
