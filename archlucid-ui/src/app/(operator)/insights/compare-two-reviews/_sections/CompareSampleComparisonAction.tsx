"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BUYER_COMPARE_OPEN_SAMPLE_COMPARISON_CTA } from "@/lib/buyer/buyer-polish-copy";
import { getShowcaseCompareHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

export type CompareSampleComparisonActionProps = {
  readonly onLoadSampleComparison?: () => void;
  readonly variant?: "outline";
  readonly size?: "sm" | "default";
};

/**
 * Loads or opens a curated sample comparison pair so buyers can preview comparison output
 * without seeding an entire workspace.
 */
export function CompareSampleComparisonAction(props: CompareSampleComparisonActionProps) {
  const { onLoadSampleComparison, variant = "outline", size = "sm" } = props;
  const staticDemo = isStaticDemoPayloadFallbackEnabled();

  if (staticDemo && onLoadSampleComparison !== undefined) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        data-testid="compare-sample-comparison-button"
        onClick={onLoadSampleComparison}
      >
        {BUYER_COMPARE_OPEN_SAMPLE_COMPARISON_CTA}
      </Button>
    );
  }

  if (staticDemo) {
    return (
      <Button type="button" variant={variant} size={size} asChild data-testid="compare-sample-comparison-button">
        <Link href={getShowcaseCompareHref()}>{BUYER_COMPARE_OPEN_SAMPLE_COMPARISON_CTA}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant={variant} size={size} asChild data-testid="compare-sample-comparison-button">
      <Link href="/architecture/reviews">Load sample reviews</Link>
    </Button>
  );
}
