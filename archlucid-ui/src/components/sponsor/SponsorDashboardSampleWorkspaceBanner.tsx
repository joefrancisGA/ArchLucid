"use client";

import { cn } from "@/lib/utils";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type SponsorDashboardSampleWorkspaceBannerProps = {
  readonly className?: string;
};

/** Makes sample/demo workspace data explicit on the sponsor dashboard. */
export function SponsorDashboardSampleWorkspaceBanner(
  props: SponsorDashboardSampleWorkspaceBannerProps,
): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  return (
    <div
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 shadow-sm dark:border-neutral-800", OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
      role="status"
      data-testid="sponsor-dashboard-sample-workspace-banner"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>
        {v.sampleWorkspaceBannerTitle}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPE_SCALE.helper)}>
        {v.sampleWorkspaceBannerDescription}
      </p>
    </div>
  );
}
