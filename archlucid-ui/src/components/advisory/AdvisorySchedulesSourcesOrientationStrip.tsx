"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  advisorySchedulesSourcesDisclosureHrefFromSearch,
  parseAdvisorySchedulesSourcesOpenFromSearch,
} from "@/lib/advisory/advisory-schedules-sources-disclosure-url";
import {
  ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE,
  ADVISORY_SCHEDULES_ORIENTATION_BOTTOM_TEST_ID,
  ADVISORY_SCHEDULES_ORIENTATION_SOURCES,
  ADVISORY_SCHEDULES_SOURCES_INTRO,
} from "@/lib/advisory-schedules-evidence-copy";

/** Sources-only follow-ups for `/governance/advisory-scans?tab=schedules` buyer-polished shell (AD). */
export function AdvisorySchedulesSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const advisorySchedulesSourcesOpenParam = searchParams.get("advisorySchedulesSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseAdvisorySchedulesSourcesOpenFromSearch(advisorySchedulesSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(advisorySchedulesSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseAdvisorySchedulesSourcesOpenFromSearch(advisorySchedulesSourcesOpenParam));
  }, [advisorySchedulesSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE}
      summaryLine={ADVISORY_SCHEDULES_SOURCES_INTRO}
      sectionTestId={ADVISORY_SCHEDULES_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="advisory-schedules-sources"
        headingId="advisory-schedules-sources-heading"
        title={ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE}
        intro={ADVISORY_SCHEDULES_SOURCES_INTRO}
        links={ADVISORY_SCHEDULES_ORIENTATION_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
