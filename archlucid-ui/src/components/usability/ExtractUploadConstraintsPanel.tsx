import { cn } from "@/lib/utils";
import { extractorUploadConstraints } from "@/lib/usability/extractor-upload-constraints";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
/** Up-front upload constraints for the Azure extractor settings page. */
export function ExtractUploadConstraintsPanel() {
  const constraints = extractorUploadConstraints();

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="extract-upload-constraints"
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>Before you upload</h3>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Package ZIP uploads turn Azure inventory into evidence for your review — findings and signed deliverables trace back to this trail.
      </p>
      <dl className="m-0 mt-3 grid gap-3 sm:grid-cols-2">
        {constraints.map((row) => (
          <div key={row.label}>
            <dt className={cn("font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 mt-0.5 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{row.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
