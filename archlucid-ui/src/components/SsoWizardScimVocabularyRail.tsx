"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildSsoWizardScimPairwiseRail,
  type SsoWizardScimSurfaceId,
  type SsoWizardScimVocabularyModel,
} from "@/lib/vocabulary/sso-wizard-scim-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.ssoWizardLink,
          peerLink: props.model.scimLink,
        }
      : buildSsoWizardScimPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="sso-wizard-scim-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
