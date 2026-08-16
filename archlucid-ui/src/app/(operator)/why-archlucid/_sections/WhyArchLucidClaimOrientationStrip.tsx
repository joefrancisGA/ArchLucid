import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  WHY_ARCHLUCID_CLAIM_DISCIPLINE,
  WHY_ARCHLUCID_SOURCES,
  WHY_ARCHLUCID_SOURCES_INTRO,
} from "@/lib/why-archlucid-evidence-copy";

/** Claim discipline + Sources index for Pilot proof telemetry (WH). */
export function WhyArchLucidClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="why-archlucid"
      claim={WHY_ARCHLUCID_CLAIM_DISCIPLINE}
      claimHeading="Pilot proof only"
      sourcesIntro={WHY_ARCHLUCID_SOURCES_INTRO}
      sources={WHY_ARCHLUCID_SOURCES}
    />
  );
}
