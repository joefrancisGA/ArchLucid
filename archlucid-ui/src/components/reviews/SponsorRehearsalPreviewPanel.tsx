"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildSponsorRehearsalPreview,
  type SponsorRehearsalPreviewInput,
} from "@/lib/sponsor-rehearsal-preview";
import { cn } from "@/lib/utils";

export type SponsorRehearsalPreviewPanelProps = {
  readonly input?: SponsorRehearsalPreviewInput | null;
  readonly className?: string;
  /** When false, content is always visible (no disclosure). Default true. */
  readonly collapsedByDefault?: boolean;
};

/**
 * Preview-as-sponsor rehearsal mode (TB-2208).
 * Shows the four sponsor-facing sections operators should review before send.
 */
export function SponsorRehearsalPreviewPanel(
  props: SponsorRehearsalPreviewPanelProps,
): ReactElement {
  const collapsedByDefault = props.collapsedByDefault !== false;
  const preview = buildSponsorRehearsalPreview(props.input ?? {});

  const body = (
    <div className="space-y-3" data-testid="sponsor-rehearsal-preview-body">
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="sponsor-rehearsal-preview-caution"
      >
        {preview.caution}
      </p>
      {preview.sections.map((section) => (
        <section
          key={section.id}
          className="space-y-1"
          data-testid={`sponsor-rehearsal-section-${section.id}`}
          data-empty={section.isEmpty ? "true" : "false"}
        >
          <h3 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            {section.title}
          </h3>
          <p
            className={cn(
              "m-0 whitespace-pre-wrap text-al-text-primary",
              OPERATOR_TYPOGRAPHY.body,
              section.isEmpty ? "text-al-text-secondary" : null,
            )}
          >
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );

  if (!collapsedByDefault) {
    return (
      <section
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800",
          props.className,
        )}
        data-testid="sponsor-rehearsal-preview"
        aria-label="Preview as sponsor"
      >
        <p className={cn("m-0 mb-2 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Preview as sponsor
        </p>
        {body}
      </section>
    );
  }

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="sponsor-rehearsal-preview"
    >
      <summary
        className={cn("cursor-pointer select-none font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      >
        Preview as sponsor
      </summary>
      <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">{body}</div>
    </details>
  );
}