import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE,
  SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE_HEADING,
  SPECIALTY_WALKTHROUGHS_HELP_CLAIM_HEADING_ID,
  SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO,
} from "@/lib/specialty-walkthroughs-help-evidence-copy";

/** Claim + Sources orientation for `/help/specialty-walkthroughs` full operator shell (HS). */
export function HelpSpecialtyWalkthroughEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-specialty-walkthroughs"
      claimTestId="help-specialty-walkthroughs-claim-discipline"
      claim={SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE}
      claimHeading={SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SPECIALTY_WALKTHROUGHS_HELP_CLAIM_HEADING_ID}
      sourcesTitle={SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO}
      sources={SPECIALTY_WALKTHROUGHS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
    />
  );
}
