import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_INTAKE_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_INTAKE_HELP_SOURCES,
  EVIDENCE_INTAKE_HELP_SOURCES_INTRO,
} from "@/lib/evidence-intake-help-evidence-copy";

/** Sources follow-ups for `/help/evidence-intake` (EVI). */
export function HelpEvidenceIntakeClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-evidence-intake"
      sourcesTestId="help-evidence-intake-sources"
      sourcesTitle={EVIDENCE_INTAKE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_INTAKE_HELP_SOURCES_INTRO}
      sources={EVIDENCE_INTAKE_HELP_SOURCES}
    />
  );
}
