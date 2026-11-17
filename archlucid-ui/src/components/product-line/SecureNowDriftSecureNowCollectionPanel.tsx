"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { SecureNowCollectionSetupStatusSection } from "@/components/product-line/SecureNowCollectionSetupStatusSection";
import { SecureNowDriftPostCaptureNextStep } from "@/components/product-line/SecureNowDriftPostCaptureNextStep";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";

export type SecureNowDriftSecureNowCollectionPanelProps = {
  readonly selectedSnapshotId: string;
};

/** SecureNow drift — collection setup when incomplete; Path inspect next step when ready. */
export function SecureNowDriftSecureNowCollectionPanel(
  props: SecureNowDriftSecureNowCollectionPanelProps,
): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const setupQuery = useSecureNowCollectionSetupInput({ snapshotCaptureSucceeded: null });

  if (productLine !== "security") {
    return null;
  }

  if (setupQuery.isPending || setupQuery.collectionInput === null) {
    return null;
  }

  if (!isSecureNowCollectionSetupComplete(setupQuery.collectionInput)) {
    return (
      <SecureNowCollectionSetupStatusSection
        testIdPrefix="infra-drift"
        collectionInput={setupQuery.collectionInput}
      />
    );
  }

  return <SecureNowDriftPostCaptureNextStep selectedSnapshotId={props.selectedSnapshotId} />;
}
