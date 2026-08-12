"use client";

import {
  buildPolicyPackChangeImpactPreview,
  type PolicyPackChangeImpactPreviewInput,
} from "@/lib/policy/policy-pack-change-impact";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PolicyPackChangeImpactNoticeProps = PolicyPackChangeImpactPreviewInput & {
  readonly className?: string;
};

/**
 * Honest assign/activate impact notice for policy packs (TB-2215).
 */
export function PolicyPackChangeImpactNotice(
  props: PolicyPackChangeImpactNoticeProps,
): React.JSX.Element {
  const preview = buildPolicyPackChangeImpactPreview({
    findingCount: props.findingCount,
    severityChangeEstimate: props.severityChangeEstimate,
  });

  return (
    <aside
      className={cn(
        "mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="policy-pack-change-impact"
      aria-label={preview.title}
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {preview.title}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{preview.body}</p>
      {preview.findingContext !== null ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {preview.findingContext}
        </p>
      ) : null}
    </aside>
  );
}