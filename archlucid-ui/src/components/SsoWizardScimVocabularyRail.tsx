"use client";

import type { JSX } from "react";

import {
  buildSsoWizardScimVocabulary,
  resolveSsoWizardScimPeerLink,
  type SsoWizardScimSurfaceId,
  type SsoWizardScimVocabularyModel,
} from "@/lib/vocabulary/sso-wizard-scim-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type SsoWizardScimVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: SsoWizardScimSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildSsoWizardScimVocabulary}. */
  readonly model?: SsoWizardScimVocabularyModel;
};

/**
 * TB-2326 — Compact vocabulary rail between SSO wizard sign-in and SCIM directory sync.
 * Mount on the SSO wizard and SCIM provisioning settings pages.
 */
export function SsoWizardScimVocabularyRail(
  props: SsoWizardScimVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildSsoWizardScimVocabulary();
  const peer = resolveSsoWizardScimPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "sso-wizard" ? model.ssoWizardLink : model.scimLink;

  return (
    <VocabularyRail
      testIdPrefix="sso-wizard-scim-vocabulary"
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
