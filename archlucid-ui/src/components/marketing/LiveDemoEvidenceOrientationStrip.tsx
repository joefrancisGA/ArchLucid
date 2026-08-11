import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  LIVE_DEMO_CLAIM_DISCIPLINE,
  LIVE_DEMO_SOURCES,
  LIVE_DEMO_SOURCES_INTRO,
} from "@/lib/live-demo-evidence-copy";

/** Evaluation Sources + claim discipline for `/live-demo` (LXX Evidence). */
export function LiveDemoEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="live-demo"
      margin="mt-6"
      align="text-left"
      sourcesIntro={LIVE_DEMO_SOURCES_INTRO}
      sources={LIVE_DEMO_SOURCES}
      claimHeading="Illustrative sample only"
      claim={LIVE_DEMO_CLAIM_DISCIPLINE}
    />
  );
}
