"use client";

import type { JSX } from "react";

import {
  buildConfigurationSystemHealthVocabulary,
  resolveConfigurationSystemHealthPeerLink,
  type ConfigurationSystemHealthSurfaceId,
  type ConfigurationSystemHealthVocabularyModel,
} from "@/lib/vocabulary/configuration-system-health-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildConfigurationSystemHealthVocabulary();
  const peer = resolveConfigurationSystemHealthPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "configuration-summary"
      ? model.configurationLink
      : model.systemHealthLink;

  return (
    <VocabularyRail
      testIdPrefix="configuration-system-health-vocabulary"
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
