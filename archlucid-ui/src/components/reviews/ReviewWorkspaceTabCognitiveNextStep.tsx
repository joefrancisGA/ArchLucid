import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { resolveReviewCognitiveLoadNextAction } from "@/lib/reviews/review-cognitive-load-copy";
import { resolveReviewWorkspaceTabCognitivePrimaryAction } from "@/lib/reviews/review-workspace-tab-cognitive-load-copy";
import { cn } from "@/lib/utils";

export type ReviewWorkspaceTabCognitiveNextStepProps = {
  readonly lifecycle: ReviewWorkspaceLifecycle;
  readonly activeTab: ReviewDetailTabId;
  readonly runId: string;
  readonly evidenceReferenceCountNotStored?: boolean;
};

export function ReviewWorkspaceTabCognitiveNextStep(
  props: ReviewWorkspaceTabCognitiveNextStepProps,
): React.JSX.Element | null {
  const primaryAction = resolveReviewWorkspaceTabCognitivePrimaryAction({
    lifecycle: props.lifecycle,
    activeTab: props.activeTab,
    runId: props.runId,
    evidenceReferenceCountNotStored: props.evidenceReferenceCountNotStored === true,
  });

  const nextAction = resolveReviewCognitiveLoadNextAction({
    openGateReviewTab: props.activeTab === "review-package" ? "review-package" : null,
    openGateLabel: null,
    evidenceReferenceCountNotStored: props.evidenceReferenceCountNotStored === true,
  });

  if (primaryAction === null) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="review-workspace-tab-cognitive-next-step"
    >
      <p className="m-0 text-al-text-secondary">{nextAction}</p>
      <Button asChild size="sm" data-testid="review-workspace-tab-cognitive-primary">
        <Link href={primaryAction.href}>{primaryAction.label}</Link>
      </Button>
    </div>
  );
}
