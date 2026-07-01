"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
/** Inline validation message: consistent with the usability prompt (focus-visible is on the input). */
export function WizardFieldError({ id, message }: { id?: string; message?: string }) {
  if (message == null || message.length === 0) {
    return null;
  }

  return (
    <p id={id} className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
      {message}
    </p>
  );
}
