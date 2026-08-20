"use client";

import type { JSX } from "react";

import {
  buildScimIdentityProvidersVocabulary,
  resolveScimIdentityProvidersPeerLink,
  type ScimIdentityProvidersSurfaceId,
  type ScimIdentityProvidersVocabularyModel,
} from "@/lib/vocabulary/scim-identity-providers-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildScimIdentityProvidersVocabulary();
  const peer = resolveScimIdentityProvidersPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "scim-provisioning"
      ? model.scimLink
      : model.identityProvidersLink;

  return (
    <VocabularyRail
      testIdPrefix="scim-identity-providers-vocabulary"
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
