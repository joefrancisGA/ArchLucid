import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_CLAIM_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_HELP_FOLLOW_UPS_TITLE,
  PREFERENCES_HELP_SOURCES,
  PREFERENCES_HELP_SOURCES_INTRO,
} from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_HELP_CLAIM_HEADING_ID } from "@/lib/preferences-help-guide-content";

export type PreferencesHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function PreferencesHelpEvidenceOrientationStrip(
  props: PreferencesHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-preferences"
      claim={PREFERENCES_HELP_CLAIM_DISCIPLINE}
      claimHeading={PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PREFERENCES_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      sourcesTitle={PREFERENCES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_HELP_SOURCES_INTRO}
      sources={PREFERENCES_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={OPERATOR_TYPOGRAPHY.sectionTitle}
    />
  );
}
