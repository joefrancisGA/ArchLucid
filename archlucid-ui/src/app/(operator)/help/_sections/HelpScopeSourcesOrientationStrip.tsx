import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SCOPE_HELP_FOLLOW_UPS_TITLE,
  SCOPE_HELP_SOURCES,
  SCOPE_HELP_SOURCES_INTRO,
} from "@/lib/scope-help-evidence-copy";

/** Sources-only follow-ups for `/help/scope` buyer-polished shell (HSX). */
export function HelpScopeSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="scope-help"
      sourcesTestId="help-scope-sources"
      sourcesTitle={SCOPE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SCOPE_HELP_SOURCES_INTRO}
      sources={SCOPE_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
