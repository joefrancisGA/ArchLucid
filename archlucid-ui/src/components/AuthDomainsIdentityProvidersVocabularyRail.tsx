"use client";

import type { JSX } from "react";

import {
  buildAuthDomainsIdentityProvidersVocabulary,
  resolveAuthDomainsIdentityProvidersPeerLink,
  type AuthDomainsIdentityProvidersSurfaceId,
  type AuthDomainsIdentityProvidersVocabularyModel,
} from "@/lib/vocabulary/auth-domains-identity-providers-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildAuthDomainsIdentityProvidersVocabulary();
  const peer = resolveAuthDomainsIdentityProvidersPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "auth-domains"
      ? model.authDomainsLink
      : model.identityProvidersLink;

  return (
    <VocabularyRail
      testIdPrefix="auth-domains-identity-providers-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
