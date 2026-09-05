"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OPERATOR_HOME_START_NEW_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
import { cn } from "@/lib/utils";

const WORKING_NEW_REVIEW_BRIDGE_COPY =
  "Open the draft editor to describe your architecture and start a review when ready.";

export type OperatorHomeWorkingPrimaryCtaProps = {
  readonly variant?: "primary" | "outline";
  /** When true, show an outline new-review action beside resume. */
  readonly showNewReviewWhenResuming?: boolean;
};

/** Working Overview sole primary — resume last draft/review, else new review in the draft editor (LI-06). */
export function OperatorHomeWorkingPrimaryCta(
  props: OperatorHomeWorkingPrimaryCtaProps = {},
): React.JSX.Element {
  const variant = props.variant ?? "primary";
  const drafts = useArchitectureDraftRegistryEntries();
  const latestDraft = drafts[0] ?? null;
  const resume = resolveOperatorHomeLatestDraftPrimaryAction(latestDraft);

  if (resume !== null) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="operator-home-working-primary-cta">
        <Button asChild variant={variant} size="sm" className="h-8 w-fit">
          <Link href={resume.href} data-testid="operator-home-working-resume-primary">
            {resume.ctaLabel}
          </Link>
        </Button>
        {props.showNewReviewWhenResuming === true ? (
          <Button asChild variant="outline" size="sm" className="h-8 w-fit">
            <Link href={ARCHITECTURES_NEW_PATH} data-testid="operator-home-working-new-review-outline">
              {OPERATOR_HOME_START_NEW_ARCHITECTURE_REVIEW_CTA}
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="operator-home-working-primary-cta">
      <Button asChild variant={variant} size="sm" className="h-8 w-fit">
        <Link href={ARCHITECTURES_NEW_PATH} data-testid="operator-home-working-new-review-primary">
          {START_REVIEW_LABEL}
        </Link>
      </Button>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
        {WORKING_NEW_REVIEW_BRIDGE_COPY}
      </p>
    </div>
  );
}
