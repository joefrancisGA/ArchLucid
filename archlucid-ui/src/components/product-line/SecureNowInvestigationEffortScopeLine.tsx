"use client";

import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_COLLECTION_READER_ROLE_LINE } from "@/lib/product-line/securenow-collection-missing-reason";
import { cn } from "@/lib/utils";

/** When a capture exists, remind the operator that ROI still requires their own minute inputs. */
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
        No successful capture yet. Enter your own investigation minutes below after collection succeeds.{" "}
        {SECURENOW_COLLECTION_READER_ROLE_LINE}
      </p>
    );
  }

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-investigation-effort-scope-from-capture"
    >
      Latest capture succeeded for this workspace. Enter your own baseline and after minutes below — not the synthetic
      worksheet.
    </p>
  );
}
