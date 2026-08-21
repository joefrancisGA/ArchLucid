"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildDeploymentStatusSystemHealthPairwiseRail,
  type DeploymentStatusSystemHealthSurfaceId,
  type DeploymentStatusSystemHealthVocabularyModel,
} from "@/lib/vocabulary/deployment-status-system-health-vocabulary";

export type DeploymentStatusSystemHealthVocabularyRailProps = {
  /** Surface hosting the strip — marks the current view and links to the peer. */
  readonly currentSurfaceId: DeploymentStatusSystemHealthSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildDeploymentStatusSystemHealthVocabulary}. */
  readonly model?: DeploymentStatusSystemHealthVocabularyModel;
};

/**
 * TB-2287 — Compact vocabulary rail between Deployment status and System health.
 * Mount on both hubs so operators do not conflate release identity with platform probes.
 */
export function DeploymentStatusSystemHealthVocabularyRail(
  props: DeploymentStatusSystemHealthVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.deploymentStatusLink,
          peerLink: props.model.systemHealthLink,
        }
      : buildDeploymentStatusSystemHealthPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="deployment-status-system-health-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
