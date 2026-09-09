import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  ACCESS_DENIED_FOLLOW_UPS_TITLE,
  ACCESS_DENIED_SOURCES,
  ACCESS_DENIED_SOURCES_INTRO,
} from "@/lib/access-denied-evidence-copy";

/** Claim discipline + Sources index for access denied (4XX). */
export function AccessDeniedClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="access-denied"
      sourcesTestId="access-denied-sources"
      sourcesTitle={ACCESS_DENIED_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCESS_DENIED_SOURCES_INTRO}
      sources={ACCESS_DENIED_SOURCES}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
