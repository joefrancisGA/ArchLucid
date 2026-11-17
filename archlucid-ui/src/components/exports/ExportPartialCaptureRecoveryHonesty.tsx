"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { EXPORT_PARTIAL_CAPTURE_RECOVERY_MIDDLE_LINE } from "@/lib/exports/export-partial-capture-recovery-honesty-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function ExportPartialCaptureRecoveryHonesty(props: {
  readonly show: boolean;
  readonly testId: string;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
}): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!props.show || !isSecureNowProductLine(productLine) || !partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId={props.testId}
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={EXPORT_PARTIAL_CAPTURE_RECOVERY_MIDDLE_LINE}
      cloudConnectionsTestId={props.cloudConnectionsTestId}
      extractUploadTestId={props.extractUploadTestId}
    />
  );
}