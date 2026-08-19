"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { isExplicitStaticDemoMarketingBuild } from "@/lib/buyer/buyer-demo-content-gating";

export type RunsPageBuyerHelpTipProps = {
  readonly variant: "search" | "sample-workspace";
};

/**
 * Compact help control so the reviews index body can stay one line wide with disclosure in a tooltip.
 */
export function RunsPageBuyerHelpTip(props: RunsPageBuyerHelpTipProps) {
  const { variant } = props;

  const demoMarketing = isExplicitStaticDemoMarketingBuild();

  const label =
    variant === "search"
      ? "Search reviews on this page"
      : demoMarketing
        ? "this demonstration workspace"
        : "this workspace";

  const hint =
    variant === "search"
      ? "Use Search reviews below to narrow by title or description. Each row opens the full review — sealed review record, evidence trail, findings, and deliverables — for that run."
      : demoMarketing
        ? "Demonstration workspace — suitable for understanding output shape and navigation, not as customer-specific ROI or compliance evidence."
        : "Example review — illustrates structure and navigation for your workspace. Start a review on your own architecture when you are ready for customer-specific evidence.";

  return <FieldHelpTooltip label={label} hint={hint} />;
}
