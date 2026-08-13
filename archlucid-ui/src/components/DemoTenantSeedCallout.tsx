"use client";

import { cn } from "@/lib/utils";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

type DemoTenantSeedCalloutProps = {
  readonly className?: string;
  readonly title?: string;
  readonly description?: string;
};

const DEFAULT_TITLE = "See the sponsor ROI dashboard now";
const DEFAULT_DESCRIPTION =
  "Load the Retail baseline sample workspace — committed reviews, findings, and portfolio savings populate instantly for pilot walkthroughs.";

/** Front-and-center demo seed CTA for empty tenant surfaces (improvement #2). */
export function DemoTenantSeedCallout({
  className,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: DemoTenantSeedCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/30",
        OPERATOR_LAYOUT.sectionStack,
        className,
      )}
      data-testid="demo-tenant-seed-callout"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>{title}</p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>{description}</p>
      <SeedSampleReviewButton label="Load sample workspace" />
    </div>
  );
}
