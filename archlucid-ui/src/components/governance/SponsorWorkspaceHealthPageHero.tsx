"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  executiveWorkspaceHealthPageLead,
  SPONSOR_WORKSPACE_HEALTH_HEADING_ID,
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
  SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL,
} from "@/lib/sponsor-workspace-health-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type SponsorWorkspaceHealthPageHeroProps = {
  readonly buyerPolishedShell: boolean;
};

/**
 * Section header for workspace health — title, lead, contextual help, and workflow handoff.
 * This renders inside the sponsor dashboard, which already owns the page `h1`, so the heading is an
 * `h2` carrying the id the enclosing section's `aria-labelledby` points at.
 */
export function SponsorWorkspaceHealthPageHero({
  buyerPolishedShell,
}: SponsorWorkspaceHealthPageHeroProps): React.JSX.Element {
  return (
    <header
      className="space-y-2 border-b border-neutral-200 pb-4 dark:border-neutral-800"
      data-testid="sponsor-workspace-health-page-hero"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2
            id={SPONSOR_WORKSPACE_HEALTH_HEADING_ID}
            className={cn("m-0 tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE}
          </h2>
          <p className={cn("m-0 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {executiveWorkspaceHealthPageLead(buyerPolishedShell)}
          </p>
        </div>
        <div
          className="flex shrink-0 flex-wrap items-center gap-2"
          data-testid="sponsor-workspace-health-hero-actions"
        >
          <PageContextualHelpButton />
          <Link
            href="/governance/approval-queue"
                className={OPERATOR_LINK.optional}
            data-testid="sponsor-workspace-health-workflow-link"
          >
            {SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL}
          </Link>
        </div>
      </div>
    </header>
  );
}
