"use client";

import type { JSX } from "react";

import {
  buildIdentityProvidersSsoWizardVocabulary,
  resolveIdentityProvidersSsoWizardPeerLink,
  type IdentityProvidersSsoWizardSurfaceId,
  type IdentityProvidersSsoWizardVocabularyModel,
} from "@/lib/vocabulary/identity-providers-sso-wizard-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildIdentityProvidersSsoWizardVocabulary();
  const peer = resolveIdentityProvidersSsoWizardPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "identity-providers"
      ? model.identityProvidersLink
      : model.ssoWizardLink;

  return (
    <VocabularyRail
      testIdPrefix="identity-providers-sso-wizard-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
