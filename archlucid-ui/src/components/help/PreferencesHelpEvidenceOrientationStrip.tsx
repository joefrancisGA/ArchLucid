import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_CLAIM_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_HELP_FOLLOW_UPS_TITLE,
  PREFERENCES_HELP_SOURCES_INTRO,
  preferencesHelpSources,
} from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_HELP_CLAIM_HEADING_ID } from "@/lib/preferences-help-guide-content";

export type PreferencesHelpEvidenceOrientationStripProps = {
  readonly productLineId?: ProductLineId;
  readonly readingBodyClassName?: string;
};

export function PreferencesHelpEvidenceOrientationStrip(
  props: PreferencesHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const productLineId = props.productLineId ?? resolveProductLineIdFromEnv();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-preferences"
      claim={PREFERENCES_HELP_CLAIM_DISCIPLINE}
      claimHeading={PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PREFERENCES_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      sourcesTitle={PREFERENCES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_HELP_SOURCES_INTRO}
      sources={preferencesHelpSources(productLineId)}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={OPERATOR_TYPOGRAPHY.sectionTitle}
    />
  );
}
