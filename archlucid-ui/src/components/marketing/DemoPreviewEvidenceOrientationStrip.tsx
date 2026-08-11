import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  DEMO_PREVIEW_CLAIM_DISCIPLINE,
  DEMO_PREVIEW_SOURCES,
  DEMO_PREVIEW_SOURCES_INTRO,
} from "@/lib/demo-preview-evidence-copy";

/** Evaluation Sources + claim discipline for `/demo/preview` (DPX Evidence). */
export function DemoPreviewEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="demo-preview"
      margin="mt-8"
      align="text-left"
      sourcesIntro={DEMO_PREVIEW_SOURCES_INTRO}
      sources={DEMO_PREVIEW_SOURCES}
      claimHeading="Sample demo only"
      claim={DEMO_PREVIEW_CLAIM_DISCIPLINE}
    />
  );
}
