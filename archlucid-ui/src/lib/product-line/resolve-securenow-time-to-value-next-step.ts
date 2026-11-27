import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { buildSecureNowSecondCaptureCloudConnectionsHref } from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";
import {
  SECURENOW_SECOND_CAPTURE_CTA_LABEL,
  SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL,
  SECURENOW_SECOND_CAPTURE_CTA_HREFS,
} from "@/lib/product-line/securenow-second-capture-cta-copy";
import {
  SECURENOW_TIME_TO_VALUE_NEEDS_COLLECTION_LEAD,
  SECURENOW_TIME_TO_VALUE_NEEDS_SECOND_CAPTURE_LEAD,
} from "@/lib/product-line/securenow-time-to-value-next-step-copy";

export type SecureNowTimeToValuePhase = "needs-collection" | "needs-second-capture";

export type SecureNowTimeToValueNextStep = {
  readonly phase: SecureNowTimeToValuePhase;
  readonly lead: string;
  readonly ctaLabel: string;
  readonly href: string;
};

export function resolveSecureNowTimeToValuePhase(input: {
  readonly successfulCaptureCount: number;
  readonly collectionInput: SecureNowCollectionMissingInput;
}): SecureNowTimeToValuePhase | null {
  const collectionComplete = isSecureNowCollectionSetupComplete(input.collectionInput);

  if (!collectionComplete || input.successfulCaptureCount === 0) {
    return "needs-collection";
  }

  if (input.successfulCaptureCount === 1) {
    return "needs-second-capture";
  }

  return null;
}

export function resolveSecureNowTimeToValueNextStep(input: {
  readonly phase: SecureNowTimeToValuePhase;
  readonly returnPath?: string | null;
}): SecureNowTimeToValueNextStep {
  if (input.phase === "needs-collection") {
    return {
      phase: input.phase,
      lead: SECURENOW_TIME_TO_VALUE_NEEDS_COLLECTION_LEAD,
      ctaLabel: "Cloud connections",
      href: CLOUD_CONNECTIONS_PATH,
    };
  }

  return {
    phase: input.phase,
    lead: SECURENOW_TIME_TO_VALUE_NEEDS_SECOND_CAPTURE_LEAD,
    ctaLabel: SECURENOW_SECOND_CAPTURE_CTA_LABEL,
    href: buildSecureNowSecondCaptureCloudConnectionsHref(input.returnPath ?? null),
  };
}
