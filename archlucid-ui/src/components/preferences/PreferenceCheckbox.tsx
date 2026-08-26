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
        "accent-teal-700 focus-visible:ring-teal-700 dark:accent-teal-500 dark:focus-visible:ring-teal-500",
        className,
      )}
    />
  );
}
