import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildArchitectureIntelligenceProductLinks } from "@/lib/architecture/architecture-intelligence-product-links";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceProductRoundTripProps = {
  readonly runId: string | null | undefined;
  readonly publishedToProduct: boolean;
  readonly publishedRecommendationCount?: number;
  readonly publishSkipReason?: string | null;
};

/** Deep links into product findings / review / advisory after a successful publish. */
export function ArchitectureIntelligenceProductRoundTrip(
  props: ArchitectureIntelligenceProductRoundTripProps,
): ReactElement | null {
  const links = buildArchitectureIntelligenceProductLinks(props.runId);

  if (links === null) {
    return null;
  }

  if (!props.publishedToProduct && !(props.publishSkipReason?.trim())) {
    return null;
  }

  return (
    <div
      className="space-y-2 rounded-md border border-teal-700/30 bg-al-surface-raised p-3"
      data-testid="architecture-intelligence-product-round-trip"
    >
      {props.publishedToProduct ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-round-trip-summary">
          Published into the product path
          {typeof props.publishedRecommendationCount === "number"
            ? ` · ${props.publishedRecommendationCount} recommendations`
            : ""}
          . Open the surfaces below to verify the loop.
        </p>
      ) : (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
          Publish skipped: {props.publishSkipReason}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="primary" size="sm">
          <Link href={links.findingsHref} data-testid="architecture-intelligence-open-findings">
            Open findings
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={links.reviewHref} data-testid="architecture-intelligence-open-review">
            Open review
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={links.advisoryHref} data-testid="architecture-intelligence-open-advisory">
            Open advisory
          </Link>
        </Button>
      </div>
    </div>
  );
}
