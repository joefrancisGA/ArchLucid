"use client";

import type { JSX } from "react";

import {
  buildSecurityTrustHelpHubVocabulary,
  resolveSecurityTrustHelpHubPeerLink,
  type SecurityTrustHelpHubSurfaceId,
  type SecurityTrustHelpHubVocabularyModel,
} from "@/lib/vocabulary/security-trust-help-hub-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type SecurityTrustHelpHubVocabularyRailProps = {
  readonly currentSurfaceId: SecurityTrustHelpHubSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: SecurityTrustHelpHubVocabularyModel;
};

/** TB-2315 — Security & trust help topic vs Security & trust admin hub. */
export function SecurityTrustHelpHubVocabularyRail(
  props: SecurityTrustHelpHubVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildSecurityTrustHelpHubVocabulary();
  const peer = resolveSecurityTrustHelpHubPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "security-trust-help"
      ? model.securityTrustHelpLink
      : model.securityTrustHubLink;

  return (
    <VocabularyRail
      testIdPrefix="security-trust-help-hub-vocabulary"
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
