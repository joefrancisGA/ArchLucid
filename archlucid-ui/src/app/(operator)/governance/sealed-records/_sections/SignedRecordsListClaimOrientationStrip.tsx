import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE,
  SIGNED_RECORDS_LIST_ORIENTATION_SOURCES,
  SIGNED_RECORDS_LIST_SOURCES_INTRO,
} from "@/lib/signed-records-list-evidence-copy";

/** Sources index for the finalized review records list hub (SI). */
export function SignedRecordsListClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="signed-records-list"
      sourcesTitle={SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE}
      sourcesIntro={SIGNED_RECORDS_LIST_SOURCES_INTRO}
      sources={SIGNED_RECORDS_LIST_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
