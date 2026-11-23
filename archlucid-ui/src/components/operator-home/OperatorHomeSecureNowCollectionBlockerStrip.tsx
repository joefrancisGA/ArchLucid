"use client";

import { SecureNowCollectionPrimaryBlockerLine } from "@/components/product-line/SecureNowCollectionPrimaryBlockerLine";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/operator/operator-home-open-gate-collection-blocker-not-load-failure-copy";
import { OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_PREFACE_LINE } from "@/lib/operator/operator-home-open-gate-collection-blocker-copy";
import { shouldShowSecureNowCollectionMissingBlock } from "@/lib/product-line/securenow-collection-missing-reason";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeSecureNowCollectionBlockerStripProps = {
  readonly workingMode: boolean;
  readonly notLoadFailureTestId?: string;
  readonly notLoadFailureLine?: string;
};

export function OperatorHomeSecureNowCollectionBlockerStrip(
  props: OperatorHomeSecureNowCollectionBlockerStripProps,
): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const { collectionInput, isPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
    enabled: isSecureNowProductLine(productLine) && props.workingMode,
  });

  if (!props.workingMode || !isSecureNowProductLine(productLine) || isPending || collectionInput === null) {
    return null;
  }

  if (!shouldShowSecureNowCollectionMissingBlock(collectionInput)) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="operator-home-open-gate-collection-blocker">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="operator-home-open-gate-collection-preface">
        {OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_PREFACE_LINE}
      </p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={
          props.notLoadFailureTestId ?? "operator-home-open-gate-collection-blocker-not-load-failure"
        }
      >
        {props.notLoadFailureLine ?? OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE}
      </p>
      <SecureNowCollectionPrimaryBlockerLine input={collectionInput} testIdPrefix="operator-home-open-gate" />
    </div>
  );
}
