"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import {
  homeGovernanceWarningsHrefFromSearch,
  runsDashboardTabHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { OPERATOR_ATTENTION_KIND_DESTINATIONS } from "@/lib/operator/operator-attention-kind-destinations";
import {
  buildOperatorHomeRecentReviewsOutcomeParts,
  type OperatorHomeRecentReviewsOutcomePart,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeRecentReviewsOutcomeLineProps = {
  readonly metrics: OperatorHomeWorkspaceMetricsSnapshot;
  readonly openAllReviewsHref: string;
  readonly options?: {
    readonly exampleReviewOnly?: boolean;
    readonly visibleCount?: number;
    readonly recentTotalCount?: number;
    readonly awaitingApprovalCount?: number;
  };
};

function resolveOutcomePartHref(
  part: OperatorHomeRecentReviewsOutcomePart,
  currentSearch: string,
  openAllReviewsHref: string,
): string | undefined {
  if (part.hrefKind === undefined) {
    return undefined;
  }

  switch (part.hrefKind) {
    case "all-reviews":
      return openAllReviewsHref;
    case "tab":
      return runsDashboardTabHrefFromSearch(currentSearch, part.tabId as RunsDashboardTabId);
    case "governance-warnings-filter":
      return homeGovernanceWarningsHrefFromSearch(currentSearch);
    case "awaiting-approval":
      return OPERATOR_ATTENTION_KIND_DESTINATIONS["awaiting-approval"].href;
    default: {
      const _exhaustive: never = part.hrefKind;

      return _exhaustive;
    }
  }
}

/** Linked caption reconciling portfolio counts with the preview table beneath. */
export function OperatorHomeRecentReviewsOutcomeLine(
  props: OperatorHomeRecentReviewsOutcomeLineProps,
): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const parts = buildOperatorHomeRecentReviewsOutcomeParts(props.metrics, props.options);

  if (parts.length === 0) {
    return null;
  }

  const currentSearch = searchParams.toString();

  return (
    <p
      className={cn("m-0 leading-snug", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
      data-testid="operator-home-recent-reviews-outcome"
    >
      {parts.map((part, index) => {
        const href = resolveOutcomePartHref(part, currentSearch, props.openAllReviewsHref);
        const separator = index === 0 ? null : (
          <span key={`${part.key}-sep`} aria-hidden="true">
            {" "}
            ·{" "}
          </span>
        );

        if (href === undefined) {
          const isScopeTail = part.key === "showing-cap" || part.key === "showing";

          return (
            <span
              key={part.key}
              className={isScopeTail ? cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary") : undefined}
            >
              {separator}
              {part.text}
            </span>
          );
        }

        return (
          <span key={part.key}>
            {separator}
            <Link href={href} className={cn("font-medium", OPERATOR_LINK.nav)}>
              {part.text}
            </Link>
          </span>
        );
      })}
    </p>
  );
}
