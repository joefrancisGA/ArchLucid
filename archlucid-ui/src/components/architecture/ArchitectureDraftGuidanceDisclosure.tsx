"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { DismissControl } from "@/components/usability/DismissControl";
import {
  ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD,
  ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY,
} from "@/lib/architecture/architecture-draft-guidance-copy";
import {
  isArchitectureDraftGuidanceDismissed,
  persistArchitectureDraftGuidanceDismissed,
} from "@/lib/architecture/architecture-draft-guidance-dismiss";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { cn } from "@/lib/utils";

export type ArchitectureDraftGuidanceDisclosureProps = {
  readonly className?: string;
};

/** Contextual help on architecture draft surfaces — draft saves do not start a review (TB-766). */
export function ArchitectureDraftGuidanceDisclosure(
  props: ArchitectureDraftGuidanceDisclosureProps,
): React.JSX.Element | null {
  const pathname = usePathname();
  const headerTopicSlug = pageHelpTopicForPathname(pathname ?? "")?.slug;
  // Skip getting-started when the page header Help button already maps to that topic.
  const showGettingStartedHelpLink = headerTopicSlug !== "getting-started";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isArchitectureDraftGuidanceDismissed()) {
      return;
    }

    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    persistArchitectureDraftGuidanceDismissed();
    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn("flex max-w-3xl items-start gap-2", props.className)}
      data-testid="architecture-draft-guidance-disclosure"
    >
      <details
        className={cn(
          "min-w-0 flex-1 rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
        )}
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
          {showGettingStartedHelpLink ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <InAppHelpLink helpSlug="getting-started" label="Getting started guide" variant="text" />
            </p>
          ) : null}
        </div>
      </details>
      <DismissControl
        className="shrink-0 self-start"
        variant="outline"
        label={ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL}
        ariaLabel={ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL}
        onDismiss={dismiss}
        data-testid="architecture-draft-guidance-dismiss"
      />
    </div>
  );
}
