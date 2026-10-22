"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildScimIdentityProvidersPairwiseRail,
  type ScimIdentityProvidersSurfaceId,
  type ScimIdentityProvidersVocabularyModel,
} from "@/lib/vocabulary/scim-identity-providers-vocabulary";

export type ScimIdentityProvidersVocabularyRailProps = {
  readonly currentSurfaceId: ScimIdentityProvidersSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ScimIdentityProvidersVocabularyModel;
};

/** TB-2294 — SCIM directory sync vs Identity providers federation. */
export function ScimIdentityProvidersVocabularyRail(
  props: ScimIdentityProvidersVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.scimLink,
          peerLink: props.model.identityProvidersLink,
        }
      : buildScimIdentityProvidersPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="scim-identity-providers-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
