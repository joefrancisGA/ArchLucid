"use client";

import type { JSX } from "react";

import {
  buildDeploymentStatusSystemHealthVocabulary,
  resolveDeploymentStatusSystemHealthPeerLink,
  type DeploymentStatusSystemHealthSurfaceId,
  type DeploymentStatusSystemHealthVocabularyModel,
} from "@/lib/vocabulary/deployment-status-system-health-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildDeploymentStatusSystemHealthVocabulary();
  const peer = resolveDeploymentStatusSystemHealthPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "deployment-status"
      ? model.deploymentStatusLink
      : model.systemHealthLink;

  return (
    <VocabularyRail
      testIdPrefix="deployment-status-system-health-vocabulary"
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
