"use client";

import type { JSX } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  getExportFormatWhenToUse,
  type ExportFormatId,
} from "@/lib/export-format-when-to-use";
import { cn } from "@/lib/utils";

export type ExportFormatWhenToUseHintProps = {
  readonly format: ExportFormatId;
  readonly className?: string;
};

/**
 * TB-2202 - one-line when-to-use hint under an export format option or button.
 */
export function ExportFormatWhenToUseHint(props: ExportFormatWhenToUseHintProps): JSX.Element {
  const entry = getExportFormatWhenToUse(props.format);

  return (
    <span
      className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={`export-format-when-to-use-${props.format}`}
    >
      {entry.whenToUse}
    </span>
  );
}
