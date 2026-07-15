"use client";

import { cn } from "@/lib/utils";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import {
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY,
} from "@/lib/architecture-draft-guidance-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureDraftGuidanceDisclosureProps = {
  readonly className?: string;
};

/** Contextual help on architecture draft surfaces — draft saves do not start a review (TB-766). */
export function ArchitectureDraftGuidanceDisclosure(
  props: ArchitectureDraftGuidanceDisclosureProps,
): React.JSX.Element {
  return (
    <details
      className={cn(
        "max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="architecture-draft-guidance-disclosure"
    >
      <summary className={cn("cursor-pointer select-none px-3 py-2", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY}
      </summary>
      <div
        className={cn(
          "space-y-2 border-t border-neutral-200 px-3 py-2 dark:border-neutral-700",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        <p className="m-0">{ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <InAppHelpLink helpSlug="getting-started" label="Getting started guide" variant="text" />
        </p>
      </div>
    </details>
  );
}
