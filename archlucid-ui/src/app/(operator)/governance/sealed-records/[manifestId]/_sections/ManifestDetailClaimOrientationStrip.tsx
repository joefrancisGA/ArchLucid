import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SIGNED_RECORD_CLAIM_DISCIPLINE,
  SIGNED_RECORD_SOURCES,
  SIGNED_RECORD_SOURCES_INTRO,
} from "@/lib/signed-record-evidence-copy";
import { SEALED_RECORD_DETAIL_CLAIM_HEADING } from "@/lib/sealed-record-detail-page-copy";

/** Claim discipline + Sources index for Finalized review record detail (MMX). */
export function ManifestDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="sealed-record-detail"
      claim={SIGNED_RECORD_CLAIM_DISCIPLINE}
      claimHeading={SEALED_RECORD_DETAIL_CLAIM_HEADING}
      sourcesIntro={SIGNED_RECORD_SOURCES_INTRO}
      sources={SIGNED_RECORD_SOURCES}
    />
  );
}
