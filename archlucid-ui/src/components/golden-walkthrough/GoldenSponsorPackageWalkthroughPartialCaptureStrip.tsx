"use client";

import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PARTIAL_CAPTURE_LINE } from "@/lib/golden-sponsor-package-walkthrough-partial-capture-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export function GoldenSponsorPackageWalkthroughPartialCaptureStrip(): React.JSX.Element | null {
  const { productLine } = useProductLine();

  return isSecureNowProductLine(productLine) ? <SecureNowGoldenPartialCaptureStrip /> : null;
}

function SecureNowGoldenPartialCaptureStrip(): React.JSX.Element | null {
  const partialCapture = useLatestSnapshotCaptureIsPartial(true);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();

  if (!partialCapture) {
    return null;
  }

  return (
    <SecureNowPartialCaptureRecoveryParagraph
      testId="golden-sponsor-package-walkthrough-partial-capture"
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId="golden-sponsor-package-walkthrough-partial-cloud"
      extractUploadTestId="golden-sponsor-package-walkthrough-partial-extract"
    />
  );
}
