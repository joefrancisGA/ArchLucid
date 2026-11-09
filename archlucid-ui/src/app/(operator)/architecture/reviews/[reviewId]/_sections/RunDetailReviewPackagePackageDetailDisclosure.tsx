import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailReviewPackagePackageDetailDisclosureProps = {
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
};

const SUMMARY_LABEL = "Package detail" as const;

const SUMMARY_HELPER =
  "Receipt, classification, semantic support, and measurement strips — expand when you need the full stamp band." as const;

/** Collapses post-spine stamp strips so the first-review spine stays the primary focal band. */
export function RunDetailReviewPackagePackageDetailDisclosure(
  props: RunDetailReviewPackagePackageDetailDisclosureProps,
): React.JSX.Element {
  return (
    <details
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
      data-testid="run-detail-review-package-package-detail-disclosure"
      open={props.defaultOpen === true}
    >
      <summary
        className={cn("cursor-pointer select-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="run-detail-review-package-package-detail-disclosure-summary"
      >
        {SUMMARY_LABEL}
      </summary>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SUMMARY_HELPER}</p>
      <div className="mt-3 space-y-3">{props.children}</div>
    </details>
  );
}
