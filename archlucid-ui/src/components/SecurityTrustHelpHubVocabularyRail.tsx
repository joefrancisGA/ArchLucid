"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildSecurityTrustHelpHubPairwiseRail,
  type SecurityTrustHelpHubSurfaceId,
  type SecurityTrustHelpHubVocabularyModel,
} from "@/lib/vocabulary/security-trust-help-hub-vocabulary";

export type SecurityTrustHelpHubVocabularyRailProps = {
  readonly currentSurfaceId: SecurityTrustHelpHubSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: SecurityTrustHelpHubVocabularyModel;
};

/** TB-2315 — Security & Trust help topic vs Security & Trust admin hub. */
export function SecurityTrustHelpHubVocabularyRail(
  props: SecurityTrustHelpHubVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.securityTrustHelpLink,
          peerLink: props.model.securityTrustHubLink,
        }
      : buildSecurityTrustHelpHubPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="security-trust-help-hub-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
