import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE,
  SIGNED_RECORD_ARTIFACT_ORIENTATION_SOURCES,
  SIGNED_RECORD_ARTIFACT_SOURCES_INTRO,
} from "@/lib/signed-record-artifact-evidence-copy";

/** Sources index for signed-record artifact preview (GAR). */
export function SignedRecordArtifactClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="signed-record-artifact"
      sourcesTitle={SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE}
      sourcesIntro={SIGNED_RECORD_ARTIFACT_SOURCES_INTRO}
      sources={SIGNED_RECORD_ARTIFACT_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
