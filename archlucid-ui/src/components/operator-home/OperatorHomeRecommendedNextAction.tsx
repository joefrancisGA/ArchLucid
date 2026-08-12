"use client";

import Link from "next/link";
import { useMemo } from "react";

import { InlineGuidance } from "@/components/InlineGuidance";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OPERATOR_HOME_RECOMMENDED_NEXT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  resolveOperatorHomeRecommendedNextAction,
  resolveOperatorHomeRecommendedNextFallback,
} from "@/lib/resolve-operator-home-recommended-next-action";
import { cn } from "@/lib/utils";

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
          <Link href={recommendedNext.href} className={OPERATOR_LINK.inline}>
            {recommendedNext.message}
          </Link>
        ) : (
          recommendedNext.message
        )}
      </InlineGuidance>
    </p>
  );
}
