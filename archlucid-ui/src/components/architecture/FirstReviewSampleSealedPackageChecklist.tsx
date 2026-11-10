import {
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_CHECKLIST,
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_HEADING,
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_LEAD,
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_NOT_YET,
} from "@/lib/first-review-sample-sealed-package-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** First-review guide — what the sample shows versus a sealed tenant review. */
export function FirstReviewSampleSealedPackageChecklist(): React.JSX.Element {
  return (
    <section
      aria-labelledby="first-review-sample-sealed-package-heading"
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="first-review-sample-sealed-package-checklist"
    >
      <h2
        id="first-review-sample-sealed-package-heading"
        className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_HEADING}
      </h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_LEAD}</p>
      <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Sample includes</p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_CHECKLIST.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Not yet your sealed review</p>
      <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_NOT_YET.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
