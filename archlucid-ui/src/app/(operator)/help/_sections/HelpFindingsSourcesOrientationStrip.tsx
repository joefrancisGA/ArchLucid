"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  FINDINGS_HELP_FOLLOW_UPS_TITLE,
  resolveFindingsHelpSources,
  resolveFindingsHelpSourcesIntro,
} from "@/lib/findings/findings-help-evidence-copy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { FINDINGS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/findings/findings-help-page-copy";
import {
  helpFindingsSourcesDisclosureHrefFromSearch,
  parseHelpFindingsSourcesOpenFromSearch,
} from "@/lib/help/help-findings-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpFindingsSourcesOrientationStrip(): React.JSX.Element {
  const productLineId = resolveProductLineIdFromEnv();

  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-findings-sources"
      searchParamKey="helpFindingsSourcesOpen"
      parseOpenFromSearch={parseHelpFindingsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpFindingsSourcesDisclosureHrefFromSearch}
      sectionTestId={FINDINGS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={FINDINGS_HELP_FOLLOW_UPS_TITLE}
      intro={resolveFindingsHelpSourcesIntro(productLineId)}
      links={resolveFindingsHelpSources(productLineId)}
      sourcesTestId="help-findings-sources"
    />
  );
}
