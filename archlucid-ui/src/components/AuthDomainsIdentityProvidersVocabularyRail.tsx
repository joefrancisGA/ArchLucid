"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAuthDomainsIdentityProvidersPairwiseRail,
  type AuthDomainsIdentityProvidersSurfaceId,
  type AuthDomainsIdentityProvidersVocabularyModel,
} from "@/lib/vocabulary/auth-domains-identity-providers-vocabulary";

export type AuthDomainsIdentityProvidersVocabularyRailProps = {
  readonly currentSurfaceId: AuthDomainsIdentityProvidersSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: AuthDomainsIdentityProvidersVocabularyModel;
};

/** TB-2299 — Sign-in domains enforcement vs Identity providers federation. */
export function AuthDomainsIdentityProvidersVocabularyRail(
  props: AuthDomainsIdentityProvidersVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.authDomainsLink,
          peerLink: props.model.identityProvidersLink,
        }
      : buildAuthDomainsIdentityProvidersPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="auth-domains-identity-providers-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
