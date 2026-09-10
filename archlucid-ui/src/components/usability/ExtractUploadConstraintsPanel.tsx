"use client";

import { cn } from "@/lib/utils";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { extractorUploadConstraints } from "@/lib/usability/extractor-upload-constraints";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ExtractUploadConstraintsPanelProps = {
  readonly platform?: CloudInventoryPlatform;
};

/** Up-front upload constraints for the extract & upload settings page. */
export function ExtractUploadConstraintsPanel(props: ExtractUploadConstraintsPanelProps) {
  const { productLine } = useLocalizedProductCopy();
  const constraints = extractorUploadConstraints(props.platform ?? "azure", undefined, productLine);

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="extract-upload-constraints"
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Before you upload
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Package ZIP uploads turn cloud inventory into evidence for architecture reviews.
      </p>
      <dl className="m-0 mt-3 grid grid-cols-1 gap-3">
        {constraints.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className={cn("font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 mt-0.5 min-w-0 break-words text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {row.detail}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
