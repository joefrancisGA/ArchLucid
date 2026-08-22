import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { SIGNED_RECORD_SOURCES, SIGNED_RECORD_SOURCES_INTRO } from "@/lib/signed-record-evidence-copy";

/** Sources index for Finalized review record detail — header already states package scope. */
export function ManifestDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="sealed-record-detail"
      sourcesIntro={SIGNED_RECORD_SOURCES_INTRO}
      sources={SIGNED_RECORD_SOURCES}
    />
  );
}
