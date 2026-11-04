"use client";

import { SecureNowCollectionSetupChecklist } from "@/components/product-line/SecureNowCollectionSetupChecklist";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatSecureNowCollectionSetupProgressSummary } from "@/lib/product-line/format-securenow-collection-setup-progress";
import { cn } from "@/lib/utils";

export function SecureNowFirstHourCollectionSetupSection(): React.JSX.Element | null {
  const { collectionInput, isPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
  });

  if (isPending || collectionInput === null) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="securenow-first-hour-collection-setup-loading"
      >
        Loading collection setup status…
      </p>
    );
  }

  return (
    <section
      aria-labelledby="securenow-first-hour-collection-setup-heading"
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="securenow-first-hour-collection-setup"
    >
      <h2 id="securenow-first-hour-collection-setup-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Collection setup
      </h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-first-hour-collection-setup-progress">
        {formatSecureNowCollectionSetupProgressSummary(collectionInput)}
      </p>
      <SecureNowCollectionSetupChecklist
        input={collectionInput}
        testIdPrefix="securenow-first-hour"
        titleHeadingLevel="helper"
      />
    </section>
  );
}
