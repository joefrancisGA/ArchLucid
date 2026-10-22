"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildConfigurationSystemHealthPairwiseRail,
  type ConfigurationSystemHealthSurfaceId,
  type ConfigurationSystemHealthVocabularyModel,
} from "@/lib/vocabulary/configuration-system-health-vocabulary";

export type ConfigurationSystemHealthVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ConfigurationSystemHealthSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildConfigurationSystemHealthVocabulary}. */
  readonly model?: ConfigurationSystemHealthVocabularyModel;
};

/**
 * TB-2279 — Compact vocabulary rail between Configuration summary and System health.
 * Mount on Admin configuration and System health so operators do not conflate knobs with probes.
 */
export function ConfigurationSystemHealthVocabularyRail(
  props: ConfigurationSystemHealthVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.configurationLink,
          peerLink: props.model.systemHealthLink,
        }
      : buildConfigurationSystemHealthPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="configuration-system-health-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
