"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildIdentityProvidersSsoWizardPairwiseRail,
  type IdentityProvidersSsoWizardSurfaceId,
  type IdentityProvidersSsoWizardVocabularyModel,
} from "@/lib/vocabulary/identity-providers-sso-wizard-vocabulary";

export type IdentityProvidersSsoWizardVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: IdentityProvidersSsoWizardSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildIdentityProvidersSsoWizardVocabulary}. */
  readonly model?: IdentityProvidersSsoWizardVocabularyModel;
};

/**
 * TB-2277 — Compact vocabulary rail between identity-providers hub and SSO wizard.
 * Mount on the hub client and early SSO wizard step.
 */
export function IdentityProvidersSsoWizardVocabularyRail(
  props: IdentityProvidersSsoWizardVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.identityProvidersLink,
          peerLink: props.model.ssoWizardLink,
        }
      : buildIdentityProvidersSsoWizardPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="identity-providers-sso-wizard-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
