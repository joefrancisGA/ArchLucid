"use client";

import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_COLLECTION_READER_ROLE_LINE } from "@/lib/product-line/securenow-collection-missing-reason";
import { SECURENOW_INVESTIGATION_EFFORT_NO_CAPTURE_LINE } from "@/lib/product-line/securenow-investigation-effort-copy";
import { cn } from "@/lib/utils";

/** When a capture exists, remind the operator that ROI still uses their entered hours. */
export function SecureNowInvestigationEffortScopeLine(): React.JSX.Element | null {
  const { collectionInput, isPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
    enabled: true,
  });

  if (isPending || collectionInput === null) {
    return null;
  }

  if (!collectionInput.hasSuccessfulPull) {
    return (
      <p
        className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="securenow-investigation-effort-scope-missing"
      >
        {SECURENOW_INVESTIGATION_EFFORT_NO_CAPTURE_LINE}{" "}
        {SECURENOW_COLLECTION_READER_ROLE_LINE}
      </p>
    );
  }

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-investigation-effort-scope-from-capture"
    >
      This workspace has a successful capture. Enter your own investigation times before and after using SecureNow.
    </p>
  );
}
