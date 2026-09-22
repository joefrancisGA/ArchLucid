"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import {
  architectureIdentityDraftHref,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import {
  WORKING_ARCHITECTURE_NESTED_RESUME_DRAFT_HEADING,
  WORKING_ARCHITECTURE_NESTED_RESUME_REVIEW_HEADING,
} from "@/lib/architecture/working-architecture-nested-tool-copy";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";
import { OPERATOR_RESUME, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type WorkingArchitectureNestedResumeStripProps = {
  readonly architectureId: string;
};

/** Resume context for nested tools — open draft or in-progress review on this architecture. */
export function WorkingArchitectureNestedResumeStrip(
  props: WorkingArchitectureNestedResumeStripProps,
): React.JSX.Element | null {
  const architectureId = props.architectureId.trim();
  const query = useArchitectureIdentityQuery(architectureId);
  const identity = query.data;

  if (identity === undefined || query.isLoading) {
    return null;
  }

  const currentDraftId = identity.currentDraftId?.trim() ?? "";
  const latestReviewId = identity.latestReviewId?.trim() ?? "";

  if (currentDraftId.length > 0) {
    const draftLabel =
      identity.drafts.find((draft) => draft.draftId === currentDraftId)?.systemName?.trim()
      ?? "Open draft";

    return (
      <section
        aria-labelledby="working-architecture-nested-resume-draft-heading"
        className={OPERATOR_RESUME.stripSpaced}
        data-testid="working-architecture-nested-resume-strip"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="working-architecture-nested-resume-draft-heading"
              className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            >
              {WORKING_ARCHITECTURE_NESTED_RESUME_DRAFT_HEADING}
            </h2>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <span className="font-medium text-al-text-primary">{draftLabel}</span>
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" asChild data-testid="working-architecture-nested-resume-open">
            <Link href={architectureIdentityDraftHref(architectureId, currentDraftId)}>Open</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (latestReviewId.length > 0) {
    const reviewHref = resolveWorkingInhabitedFindingsLandingHref({
      runId: latestReviewId,
      architectureId,
      workingMode: true,
    });
    const fallbackHref = resolveArchitectureReviewHref(latestReviewId, architectureId);

    return (
      <section
        aria-labelledby="working-architecture-nested-resume-review-heading"
        className={OPERATOR_RESUME.stripSpaced}
        data-testid="working-architecture-nested-resume-strip"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="working-architecture-nested-resume-review-heading"
              className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            >
              {WORKING_ARCHITECTURE_NESTED_RESUME_REVIEW_HEADING}
            </h2>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <span className="font-medium text-al-text-primary">{latestReviewId}</span>
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" asChild data-testid="working-architecture-nested-resume-open">
            <Link href={reviewHref.length > 0 ? reviewHref : fallbackHref}>Open</Link>
          </Button>
        </div>
      </section>
    );
  }

  return null;
}
