"use client";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ExecutiveDashboardSampleWorkspaceBannerProps = {
  readonly className?: string;
};

/** Makes sample/demo workspace data explicit on the executive dashboard. */
export function ExecutiveDashboardSampleWorkspaceBanner(
  props: ExecutiveDashboardSampleWorkspaceBannerProps,
): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 text-sm shadow-sm dark:border-neutral-800",
        props.className,
      )}
      role="status"
      data-testid="executive-dashboard-sample-workspace-banner"
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPE_SCALE.section)}>
        {v.sampleWorkspaceBannerTitle}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPE_SCALE.meta)}>
        {v.sampleWorkspaceBannerDescription}
      </p>
    </div>
  );
}
