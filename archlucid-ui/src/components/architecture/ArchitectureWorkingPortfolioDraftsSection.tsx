"use client";

import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SECTION_ID,
  SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SUBTITLE,
  SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_TITLE,
} from "@/lib/system-not-job-draft-list-reachable-from-portfolio";
import { cn } from "@/lib/utils";

/** Working portfolio open-drafts band — IA-002 leftover beside identity list (SN-029). */
export function ArchitectureWorkingPortfolioDraftsSection(): React.JSX.Element {
  return (
    <section
      id={SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SECTION_ID}
      aria-labelledby="architecture-working-portfolio-open-drafts-heading"
      data-testid="architecture-working-portfolio-open-drafts"
      className="space-y-3"
    >
      <div>
        <h2
          id="architecture-working-portfolio-open-drafts-heading"
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SUBTITLE}
        </p>
      </div>
      <ArchitectureDraftListClient presentation="working-portfolio" />
    </section>
  );
}
