"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
  GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-approval-help-evidence-copy";
import { GOVERNANCE_APPROVAL_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/governance/governance-approval-help-page-copy";
import {
  helpGovernanceApprovalSourcesDisclosureHrefFromSearch,
  parseHelpGovernanceApprovalSourcesOpenFromSearch,
} from "@/lib/help/help-governance-approval-sources-disclosure-url";

/** Sources-only follow-ups for `/help/governance-approval` buyer-polished shell (GO). */
export function HelpGovernanceApprovalSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpGovernanceApprovalSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpGovernanceApprovalSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpGovernanceApprovalSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpGovernanceApprovalSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE}
      summaryLine={GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO}
      sectionTestId={GOVERNANCE_APPROVAL_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-governance-approval-sources"
        headingId="where-to-go-next"
        title={GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE}
        intro={GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO}
        links={GOVERNANCE_APPROVAL_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
