"use client";

import { SecureNowAdoptionFrictionNextStepStrip } from "@/components/product-line/SecureNowAdoptionFrictionNextStepStrip";
import {
  resolveSecureNowHomeCollectionSetupFallbackInput,
  useSecureNowCollectionSetupInput,
} from "@/hooks/use-securenow-collection-setup-input";
import {
  resolveSecureNowAdoptionFrictionNextStep,
  resolveSecureNowAdoptionFrictionPhase,
} from "@/lib/product-line/resolve-securenow-adoption-friction-next-step";

export type SecureNowAdoptionFrictionNextStepAutoProps = {
  readonly testId: string;
  readonly enabled?: boolean;
  readonly snapshotCaptureSucceeded?: boolean | null;
};

export function SecureNowAdoptionFrictionNextStepAuto(
  props: SecureNowAdoptionFrictionNextStepAutoProps,
): React.JSX.Element | null {
  const enabled = props.enabled !== false;
  const setupQuery = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: props.snapshotCaptureSucceeded ?? null,
  });

  if (!enabled || setupQuery.isPending) {
    return null;
  }

  const collectionInput =
    setupQuery.collectionInput
    ?? resolveSecureNowHomeCollectionSetupFallbackInput({
      snapshotCaptureSucceeded: props.snapshotCaptureSucceeded ?? null,
      subscriptionLabelPresent: false,
    });

  const phase = resolveSecureNowAdoptionFrictionPhase({ collectionInput });

  if (phase === null) {
    return null;
  }

  const nextStep = resolveSecureNowAdoptionFrictionNextStep({ phase, collectionInput });

  return <SecureNowAdoptionFrictionNextStepStrip testId={props.testId} nextStep={nextStep} />;
}
