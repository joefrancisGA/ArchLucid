"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/baseline-settings-help-page-copy";
import {
  helpBaselineSettingsSourcesDisclosureHrefFromSearch,
  parseHelpBaselineSettingsSourcesOpenFromSearch,
} from "@/lib/help/help-baseline-settings-sources-disclosure-url";

/** Sources-only follow-ups for `/help/baseline-settings` buyer-polished shell (HEB). */
export function HelpBaselineSettingsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpBaselineSettingsSourcesOpenParam = searchParams.get("helpBaselineSettingsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpBaselineSettingsSourcesOpenFromSearch(helpBaselineSettingsSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpBaselineSettingsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);
    },
    [syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(parseHelpBaselineSettingsSourcesOpenFromSearch(helpBaselineSettingsSourcesOpenParam));
  }, [helpBaselineSettingsSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={BASELINE_SETTINGS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-baseline-settings-sources"
        headingId="where-to-go-next"
        title={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
        intro={BASELINE_SETTINGS_HELP_ORIENTATION_SOURCES_INTRO}
        links={BASELINE_SETTINGS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
