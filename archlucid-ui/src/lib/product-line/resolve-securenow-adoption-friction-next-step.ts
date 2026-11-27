import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { resolveSecureNowCollectionBlockerKindLine } from "@/lib/product-line/securenow-collection-blocker-kind-copy";
import { resolveSecureNowCollectionPrimaryBlocker } from "@/lib/product-line/securenow-collection-setup-checklist";
import { resolveSecureNowCollectionRecoveryLinkLabel } from "@/lib/product-line/securenow-collection-recovery-copy";
import {
  SECURENOW_ADOPTION_FRICTION_NEEDS_COLLECTION_LEAD,
  SECURENOW_ADOPTION_FRICTION_READER_SCOPE_LEAD,
} from "@/lib/product-line/securenow-adoption-friction-next-step-copy";
import {
  SECURENOW_READER_SCOPE_WORKBENCH_HREF,
  SECURENOW_READER_SCOPE_WORKBENCH_LINK_LABEL,
} from "@/lib/product-line/securenow-reader-scope-workbench-copy";

export type SecureNowAdoptionFrictionPhase = "needs-collection" | "reader-scope";

export type SecureNowAdoptionFrictionNextStep = {
  readonly phase: SecureNowAdoptionFrictionPhase;
  readonly lead: string;
  readonly ctaLabel: string;
  readonly href: string;
  readonly blockerKindLine?: string;
};

export function resolveSecureNowAdoptionFrictionPhase(input: {
  readonly collectionInput: SecureNowCollectionMissingInput;
}): SecureNowAdoptionFrictionPhase | null {
  if (!isSecureNowCollectionSetupComplete(input.collectionInput)) {
    return "needs-collection";
  }

  return "reader-scope";
}

export function resolveSecureNowAdoptionFrictionNextStep(input: {
  readonly phase: SecureNowAdoptionFrictionPhase;
  readonly collectionInput: SecureNowCollectionMissingInput;
}): SecureNowAdoptionFrictionNextStep {
  if (input.phase === "reader-scope") {
    return {
      phase: input.phase,
      lead: SECURENOW_ADOPTION_FRICTION_READER_SCOPE_LEAD,
      ctaLabel: SECURENOW_READER_SCOPE_WORKBENCH_LINK_LABEL,
      href: SECURENOW_READER_SCOPE_WORKBENCH_HREF,
    };
  }

  const blocker = resolveSecureNowCollectionPrimaryBlocker(input.collectionInput);
  const blockerKindLine =
    blocker !== null ? resolveSecureNowCollectionBlockerKindLine(blocker.stepId) ?? undefined : undefined;

  return {
    phase: input.phase,
    lead: SECURENOW_ADOPTION_FRICTION_NEEDS_COLLECTION_LEAD,
    ctaLabel:
      blocker !== null
        ? resolveSecureNowCollectionRecoveryLinkLabel(blocker.stepId)
        : "Cloud connections",
    href: blocker?.recoveryHref ?? CLOUD_CONNECTIONS_PATH,
    blockerKindLine,
  };
}
