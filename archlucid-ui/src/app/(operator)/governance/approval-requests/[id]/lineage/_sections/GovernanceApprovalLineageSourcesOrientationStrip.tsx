"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  APPROVAL_LINEAGE_FOLLOW_UPS_TITLE,
  APPROVAL_LINEAGE_ORIENTATION_BOTTOM_TEST_ID,
  APPROVAL_LINEAGE_SOURCES,
  APPROVAL_LINEAGE_SOURCES_INTRO,
} from "@/lib/approval-lineage-evidence-copy";
import {
  approvalLineageSourcesDisclosureHrefFromSearch,
  parseApprovalLineageSourcesOpenFromSearch,
} from "@/lib/governance/approval-lineage-sources-disclosure-url";

/** Sources-only follow-ups for `/governance/approval-requests/[id]/lineage` buyer-polished shell (GAI). */
export function GovernanceApprovalLineageSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("approvalLineageSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseApprovalLineageSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(approvalLineageSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseApprovalLineageSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={APPROVAL_LINEAGE_FOLLOW_UPS_TITLE}
      summaryLine={APPROVAL_LINEAGE_SOURCES_INTRO}
      sectionTestId={APPROVAL_LINEAGE_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="approval-lineage-sources"
        headingId="where-to-go-next"
        title={APPROVAL_LINEAGE_FOLLOW_UPS_TITLE}
        intro={APPROVAL_LINEAGE_SOURCES_INTRO}
        links={APPROVAL_LINEAGE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
