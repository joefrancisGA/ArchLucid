import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SIGNED_RECORD_FOLLOW_UPS_TITLE,
  SIGNED_RECORD_ORIENTATION_SOURCES,
  SIGNED_RECORD_SOURCES_INTRO,
} from "@/lib/signed-record-evidence-copy";

/** Sources index for Finalized review record detail (MMX). */
export function ManifestDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="sealed-record-detail"
      sourcesTitle={SIGNED_RECORD_FOLLOW_UPS_TITLE}
      sourcesIntro={SIGNED_RECORD_SOURCES_INTRO}
      sources={SIGNED_RECORD_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
