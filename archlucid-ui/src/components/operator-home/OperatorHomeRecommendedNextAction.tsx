"use client";

import Link from "next/link";
import { useMemo } from "react";

import { InlineGuidance } from "@/components/InlineGuidance";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_HOME_RECOMMENDED_NEXT_LABEL } from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  resolveOperatorHomeRecommendedNextAction,
  resolveOperatorHomeRecommendedNextFallback,
} from "@/lib/resolve-operator-home-recommended-next-action";
import { cn } from "@/lib/utils";

const recommendedNextLinkClass = cn(
  "font-medium text-al-text-primary underline-offset-2 hover:underline",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)]",
);

/** Compact recommended-next line for first-run Overview — respects create and review equally. */
export function OperatorHomeRecommendedNextAction(): React.JSX.Element {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const commitQuery = useCorePilotCommitContextQuery();

  const recommendedNext = useMemo(() => {
    if (hasCommittedArchitectureReview) {
      if (commitQuery.isPending || commitQuery.isError) {
        return resolveOperatorHomeRecommendedNextFallback();
      }

      return resolveOperatorHomeRecommendedNextAction(commitQuery.data, hasCommittedArchitectureReview);
    }

    if (commitQuery.isPending || commitQuery.isError) {
      return resolveOperatorHomeRecommendedNextFallback();
    }

    return resolveOperatorHomeRecommendedNextAction(commitQuery.data, hasCommittedArchitectureReview);
  }, [
    commitQuery.data,
    commitQuery.isError,
    commitQuery.isPending,
    hasCommittedArchitectureReview,
  ]);

  return (
    <p
      className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
      data-testid="operator-home-recommended-next-action"
    >
      <InlineGuidance label={OPERATOR_HOME_RECOMMENDED_NEXT_LABEL} labelTestId="inline-guidance-recommended-next">
        {recommendedNext.href !== null ? (
          <Link href={recommendedNext.href} className={recommendedNextLinkClass}>
            {recommendedNext.message}
          </Link>
        ) : (
          recommendedNext.message
        )}
      </InlineGuidance>
    </p>
  );
}
