"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SIGNED_RECORD_FOLLOW_UPS_TITLE,
  SIGNED_RECORD_SOURCES_INTRO,
  resolveSignedRecordOrientationSources,
} from "@/lib/signed-record-evidence-copy";

/** Sources index for Finalized review record detail (MMX). */
export function ManifestDetailClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="sealed-record-detail"
      sourcesTitle={SIGNED_RECORD_FOLLOW_UPS_TITLE}
      sourcesIntro={SIGNED_RECORD_SOURCES_INTRO}
      sources={resolveSignedRecordOrientationSources(productLine)}
      hubSecondary
    />
  );
}
