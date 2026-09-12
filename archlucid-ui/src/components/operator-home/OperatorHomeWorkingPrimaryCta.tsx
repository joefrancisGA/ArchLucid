"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useWorkingCreateStartHref } from "@/hooks/use-working-start-href";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { resolveOperatorHomeLatestDraftPrimaryAction } from "@/lib/operator-home-latest-draft-primary-action";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";
import {
  resolveWorkingHomeNewReviewBridgeCopy,
  resolveWorkingHomeSingleStartPrimaryLabel,
} from "@/lib/system-not-job-no-second-start-cta-working";
import { cn } from "@/lib/utils";

export type OperatorHomeWorkingPrimaryCtaProps = {
  readonly variant?: "primary" | "outline";
};

/** Working Overview sole primary — resume last architecture identity, else draft/review, else new work (PC-05 / ADR 0069). */
export function OperatorHomeWorkingPrimaryCta(
  props: OperatorHomeWorkingPrimaryCtaProps = {},
): React.JSX.Element {
  const variant = props.variant ?? "primary";
  const architectureTarget = useMemo(() => resolveContinueLastArchitectureIdentityTarget(), []);
  const drafts = useArchitectureDraftRegistryEntries();
  const latestDraft = drafts[0] ?? null;
  const draftResume = resolveOperatorHomeLatestDraftPrimaryAction(latestDraft);
  const workingCreateStartHref = useWorkingCreateStartHref();

  if (architectureTarget !== null) {
    return (
      <div className="space-y-2" data-testid="operator-home-working-primary-cta">
        <Button asChild variant={variant} size="sm" className="h-8 w-fit">
          <Link href={architectureTarget.href} data-testid="operator-home-working-resume-primary">
            Open {architectureTarget.label}
          </Link>
        </Button>
      </div>
    );
  }

  if (draftResume !== null) {
    return (
      <div className="space-y-2" data-testid="operator-home-working-primary-cta">
        <Button asChild variant={variant} size="sm" className="h-8 w-fit">
          <Link href={draftResume.href} data-testid="operator-home-working-resume-primary">
            {draftResume.ctaLabel}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="operator-home-working-primary-cta">
      <Button asChild variant={variant} size="sm" className="h-8 w-fit">
        <Link href={workingCreateStartHref} data-testid="operator-home-working-new-review-primary">
          {resolveWorkingHomeSingleStartPrimaryLabel()}
        </Link>
      </Button>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
        {resolveWorkingHomeNewReviewBridgeCopy()}
      </p>
    </div>
  );
}
