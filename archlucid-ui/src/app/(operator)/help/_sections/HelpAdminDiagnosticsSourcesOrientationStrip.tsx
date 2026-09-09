"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE,
  ADMIN_DIAGNOSTICS_HELP_ORIENTATION_SOURCES_INTRO,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { ADMIN_DIAGNOSTICS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/admin-diagnostics-help-page-copy";
import {
  helpAdminDiagnosticsSourcesDisclosureHrefFromSearch,
  parseHelpAdminDiagnosticsSourcesOpenFromSearch,
} from "@/lib/help/help-admin-diagnostics-sources-disclosure-url";

/** Sources-only follow-ups for `/help/admin-diagnostics` buyer-polished shell (HAE). */
export function HelpAdminDiagnosticsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAdminDiagnosticsSourcesOpenParam = searchParams.get("helpAdminDiagnosticsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAdminDiagnosticsSourcesOpenFromSearch(helpAdminDiagnosticsSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAdminDiagnosticsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAdminDiagnosticsSourcesOpenFromSearch(helpAdminDiagnosticsSourcesOpenParam));
  }, [helpAdminDiagnosticsSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={ADMIN_DIAGNOSTICS_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={ADMIN_DIAGNOSTICS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-admin-diagnostics-sources"
        headingId="where-to-go-next"
        title={ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE}
        intro={ADMIN_DIAGNOSTICS_HELP_ORIENTATION_SOURCES_INTRO}
        links={ADMIN_DIAGNOSTICS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
