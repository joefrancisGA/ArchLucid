"use client";

import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type PreferenceCheckboxProps = CheckboxProps;

/** Shared checkbox styling for Preferences account-scoped toggles. */
export function PreferenceCheckbox({ className, checked, ...props }: PreferenceCheckboxProps): React.JSX.Element {
  return (
    <Checkbox
      {...props}
      checked={checked}
      className={cn(
        "h-6 w-6 shrink-0 rounded border-2 border-neutral-600 accent-teal-700",
        "focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
        "dark:border-neutral-400 dark:accent-teal-500",
        checked ? "border-teal-700 bg-teal-700 dark:border-teal-500 dark:bg-teal-600" : null,
        className,
      )}
    />
  );
}
