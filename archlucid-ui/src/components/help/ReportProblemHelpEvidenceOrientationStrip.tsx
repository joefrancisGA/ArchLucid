import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";

/** Claim discipline + Sources follow-ups for `/help/report-a-problem`. */
export function ReportProblemHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="report-a-problem-help"
      claim={REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      sources={REPORT_A_PROBLEM_HELP_SOURCES}
    />
  );
}
