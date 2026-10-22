import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  DPA_TEMPLATE_HELP_FOLLOW_UPS_TITLE,
  DPA_TEMPLATE_HELP_SOURCES,
  DPA_TEMPLATE_HELP_SOURCES_INTRO,
} from "@/lib/dpa-template-help-evidence-copy";

/** Sources follow-ups for `/help/dpa-template` (HDP). */
export function HelpDpaTemplateClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-dpa-template"
      sourcesTestId="help-dpa-template-sources"
      sourcesTitle={DPA_TEMPLATE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DPA_TEMPLATE_HELP_SOURCES_INTRO}
      sources={DPA_TEMPLATE_HELP_SOURCES}
    />
  );
}
