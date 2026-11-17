"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE,
  SIGNED_RECORD_ARTIFACT_SOURCES_INTRO,
  resolveSignedRecordArtifactOrientationSources,
} from "@/lib/signed-record-artifact-evidence-copy";

/** Sources index for signed-record artifact preview (GAR). */
export function SignedRecordArtifactClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="signed-record-artifact"
      sourcesTitle={SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE}
      sourcesIntro={SIGNED_RECORD_ARTIFACT_SOURCES_INTRO}
      sources={resolveSignedRecordArtifactOrientationSources(productLine)}
      hubSecondary
    />
  );
}
