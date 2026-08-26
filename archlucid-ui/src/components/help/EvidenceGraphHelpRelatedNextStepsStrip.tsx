import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_HELP_SOURCES,
  EVIDENCE_GRAPH_HELP_SOURCES_INTRO,
} from "@/lib/evidence-graph-help-evidence-copy";

/** Where-to-go-next links for `/help/evidence-graph`. */
export function EvidenceGraphHelpRelatedNextStepsStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="help-evidence-graph-orientation">
      <EvidenceOrientationSourcesSection
        testId="help-evidence-graph-sources"
        headingId="where-to-go-next"
        title={EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE}
        intro={EVIDENCE_GRAPH_HELP_SOURCES_INTRO}
        links={EVIDENCE_GRAPH_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
        listClassName={HELP_PAGE_LAYOUT.readingBody}
      />
    </EvidenceOrientationStripShell>
  );
}
