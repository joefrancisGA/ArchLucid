"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_INTELLIGENCE_REFINE_NEXT_STEPS_HEADING,
  ARCHITECTURE_INTELLIGENCE_REFINE_OPEN_FULL_LAB_LABEL,
  ARCHITECTURE_INTELLIGENCE_REFINE_OPEN_LINKED_REVIEW_LABEL,
  ARCHITECTURE_INTELLIGENCE_REFINE_START_REVIEW_HINT,
  ARCHITECTURE_INTELLIGENCE_REFINE_START_REVIEW_LABEL,
} from "@/lib/architecture/architecture-intelligence-refine-next-steps-copy";
import { CTA_WIDTH, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceRefineNextStepsProps = {
  readonly result: ClosedLoopReasoningResult;
  readonly canPublish?: boolean;
  readonly linkedReviewId?: string | null;
  readonly testIdPrefix?: string;
};

const START_REVIEW_ANCHOR_ID = "architecture-start-review-action";

/** Actionable follow-up after inline architecture intelligence refine completes. */
export function ArchitectureIntelligenceRefineNextSteps(
  props: ArchitectureIntelligenceRefineNextStepsProps,
): React.JSX.Element | null {
  if (props.result.budgetRejected === true) {
    return null;
  }

  const prefix = props.testIdPrefix ?? "architecture-intelligence-refine";
  const canPublish = props.canPublish === true;
  const linkedReviewId = props.linkedReviewId?.trim() ?? "";
  const runId = props.result.runId?.trim() ?? linkedReviewId;
  const fullLabHref =
    runId.length > 0 ? buildArchitectureIntelligenceRunHref({ runId, from: "reviews" }) : null;

  return (
    <section
      className="space-y-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700"
      data-testid={`${prefix}-next-steps`}
      aria-labelledby={`${prefix}-next-steps-heading`}
    >
      <h3
        id={`${prefix}-next-steps-heading`}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ARCHITECTURE_INTELLIGENCE_REFINE_NEXT_STEPS_HEADING}
      </h3>

      {canPublish && props.result.publishedToProduct === true && linkedReviewId.length > 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Findings were published into the linked review.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canPublish && linkedReviewId.length > 0 ? (
          <Button type="button" variant="primary" size="sm" className={CTA_WIDTH.content} asChild>
            <Link href={reviewDetailPath(linkedReviewId)} data-testid={`${prefix}-open-linked-review`}>
              {ARCHITECTURE_INTELLIGENCE_REFINE_OPEN_LINKED_REVIEW_LABEL}
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="primary" size="sm" className={CTA_WIDTH.content} asChild>
            <a href={`#${START_REVIEW_ANCHOR_ID}`} data-testid={`${prefix}-start-review`}>
              {ARCHITECTURE_INTELLIGENCE_REFINE_START_REVIEW_LABEL}
            </a>
          </Button>
        )}

        {fullLabHref !== null ? (
          <Button type="button" variant="outline" size="sm" className={CTA_WIDTH.content} asChild>
            <Link href={fullLabHref} data-testid={`${prefix}-open-full-lab`}>
              {ARCHITECTURE_INTELLIGENCE_REFINE_OPEN_FULL_LAB_LABEL}
            </Link>
          </Button>
        ) : null}
      </div>

      {!canPublish ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_INTELLIGENCE_REFINE_START_REVIEW_HINT}{" "}
          <a href="#architecture-draft-structured-brief-fields" className={OPERATOR_LINK.inline}>
            Finish the structured brief
          </a>{" "}
          if you need more grounding before starting.
        </p>
      ) : null}
    </section>
  );
}
