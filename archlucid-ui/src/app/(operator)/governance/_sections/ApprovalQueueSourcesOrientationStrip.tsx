"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  APPROVAL_QUEUE_FOLLOW_UPS_TITLE,
  APPROVAL_QUEUE_SOURCES,
  APPROVAL_QUEUE_SOURCES_INTRO,
  GOVERNANCE_APPROVAL_QUEUE_ORIENTATION_BOTTOM_TEST_ID,
} from "@/lib/approval-queue-evidence-copy";
import {
  approvalQueueSourcesDisclosureHrefFromSearch,
  parseApprovalQueueSourcesOpenFromSearch,
} from "@/lib/governance/approval-queue-sources-disclosure-url";

/** Sources-only follow-ups for `/governance/approval-queue` buyer-polished shell (GOP). */
export function ApprovalQueueSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("approvalQueueSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseApprovalQueueSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(approvalQueueSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseApprovalQueueSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={APPROVAL_QUEUE_FOLLOW_UPS_TITLE}
      summaryLine={APPROVAL_QUEUE_SOURCES_INTRO}
      sectionTestId={GOVERNANCE_APPROVAL_QUEUE_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="approval-queue-sources"
        headingId="where-to-go-next"
        title={APPROVAL_QUEUE_FOLLOW_UPS_TITLE}
        intro={APPROVAL_QUEUE_SOURCES_INTRO}
        links={APPROVAL_QUEUE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
