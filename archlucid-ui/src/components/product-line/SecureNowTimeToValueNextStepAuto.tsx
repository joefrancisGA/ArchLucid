"use client";

import { SecureNowTimeToValueNextStepStrip } from "@/components/product-line/SecureNowTimeToValueNextStepStrip";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { useSecureNowSuccessfulCaptureCount } from "@/hooks/use-securenow-successful-capture-count";
import {
  resolveSecureNowTimeToValueNextStep,
  resolveSecureNowTimeToValuePhase,
} from "@/lib/product-line/resolve-securenow-time-to-value-next-step";
import {
  resolveSecureNowHomeCollectionSetupFallbackInput,
} from "@/hooks/use-securenow-collection-setup-input";

export type SecureNowTimeToValueNextStepAutoProps = {
  readonly testId: string;
  readonly middleLine?: string;
  readonly enabled?: boolean;
  readonly snapshotCaptureSucceeded?: boolean | null;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
};

export function SecureNowTimeToValueNextStepAuto(
  props: SecureNowTimeToValueNextStepAutoProps,
): React.JSX.Element | null {
  const enabled = props.enabled !== false;
  const partialCapture = useLatestSnapshotCaptureIsPartial(enabled);
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(enabled && partialCapture);
  const returnPath = useSecureNowPartialCaptureReturnPath();
  const successfulCaptureCount = useSecureNowSuccessfulCaptureCount(enabled);
  const setupQuery = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: props.snapshotCaptureSucceeded ?? null,
  });

  if (!enabled || successfulCaptureCount === null || setupQuery.isPending) {
    return null;
  }

  const collectionInput =
    setupQuery.collectionInput
    ?? resolveSecureNowHomeCollectionSetupFallbackInput({
      snapshotCaptureSucceeded: props.snapshotCaptureSucceeded ?? null,
      subscriptionLabelPresent: false,
    });

  const phase = resolveSecureNowTimeToValuePhase({
    successfulCaptureCount,
    collectionInput,
  });

  if (phase === null) {
    return null;
  }

  const nextStep = resolveSecureNowTimeToValueNextStep({ phase, returnPath });

  return (
    <SecureNowTimeToValueNextStepStrip
      testId={props.testId}
      nextStep={nextStep}
      middleLine={props.middleLine}
      returnPath={returnPath}
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      cloudConnectionsTestId={props.cloudConnectionsTestId}
      extractUploadTestId={props.extractUploadTestId}
    />
  );
}
