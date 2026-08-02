"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY,
  IMPACT_PREVIEW_HOW_IT_WORKS_TITLE,
  IMPACT_PREVIEW_TRUST_NOTICE,
} from "@/lib/impact-preview-page-copy";

export function ImpactPreviewHowItWorksSection(): React.JSX.Element {
  return (
    <details
      className="max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="impact-preview-how-it-works"
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {IMPACT_PREVIEW_HOW_IT_WORKS_TITLE}
      </summary>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY}</p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{IMPACT_PREVIEW_TRUST_NOTICE}</p>
    </details>
  );
}
