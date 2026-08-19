"use client";

import type { JSX } from "react";

import {
  buildTrustAssuranceSecurityTrustVocabulary,
  resolveTrustAssuranceSecurityTrustLink,
  resolveTrustAssuranceSecurityTrustPeerLinks,
  type TrustAssuranceSecurityTrustSurfaceId,
  type TrustAssuranceSecurityTrustVocabularyModel,
} from "@/lib/vocabulary/trust-assurance-security-trust-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type TrustAssuranceSecurityTrustVocabularyRailProps = {
  readonly currentSurfaceId: TrustAssuranceSecurityTrustSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: TrustAssuranceSecurityTrustVocabularyModel;
};

/** TB-2302 — Trust Center vs Assurance status vs Security & Trust hub triad. */
export function TrustAssuranceSecurityTrustVocabularyRail(
  props: TrustAssuranceSecurityTrustVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildTrustAssuranceSecurityTrustVocabulary();
  const peers = resolveTrustAssuranceSecurityTrustPeerLinks(props.currentSurfaceId);
  const currentLink = resolveTrustAssuranceSecurityTrustLink(props.currentSurfaceId);

  return (
    <VocabularyRail
      testIdPrefix="trust-assurance-security-trust-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyThree}
      currentLabel={currentLink?.label ?? null}
      links={peers.map((peer) => ({
        href: peer.href,
        label: peer.label,
        testIdSuffix: `peer-${peer.id}`,
      }))}
    />
  );
}
