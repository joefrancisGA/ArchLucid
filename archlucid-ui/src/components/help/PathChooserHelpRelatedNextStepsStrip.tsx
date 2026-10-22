import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO,
  PATH_CHOOSER_HELP_SOURCES,
} from "@/lib/path-chooser-help-evidence-copy";

/** Related next steps for `/help/choose-your-next-step` — claim discipline lives in the header strip. */
export function PathChooserHelpRelatedNextStepsStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="help-path-chooser-orientation">
      <EvidenceOrientationSourcesSection
        testId="help-path-chooser-sources"
        headingId="related-next-steps"
        title={PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE}
        intro={PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO}
        links={PATH_CHOOSER_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
        listClassName={HELP_PAGE_LAYOUT.readingBody}
      />
    </EvidenceOrientationStripShell>
  );
}
