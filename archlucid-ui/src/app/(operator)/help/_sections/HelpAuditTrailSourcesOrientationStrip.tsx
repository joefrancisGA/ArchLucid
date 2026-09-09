"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";
import { AUDIT_TRAIL_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/audit-trail-help-page-copy";
import {
  helpAuditTrailSourcesDisclosureHrefFromSearch,
  parseHelpAuditTrailSourcesOpenFromSearch,
} from "@/lib/help/help-audit-trail-sources-disclosure-url";

/** Sources-only follow-ups for `/help/audit-trail` buyer-polished shell (H). */
export function HelpAuditTrailSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAuditTrailSourcesOpenParam = searchParams.get("helpAuditTrailSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAuditTrailSourcesOpenFromSearch(helpAuditTrailSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAuditTrailSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAuditTrailSourcesOpenFromSearch(helpAuditTrailSourcesOpenParam));
  }, [helpAuditTrailSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE}
      summaryLine={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      sectionTestId={AUDIT_TRAIL_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="audit-trail-help-sources"
        headingId="where-to-go-next"
        title={AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE}
        intro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
        links={AUDIT_TRAIL_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
