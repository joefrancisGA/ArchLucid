"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES,
} from "@/lib/architecture/architecture-created-findings-sources";
import {
  architectureCreatedFindingsSourcesDisclosureHrefFromSearch,
  parseArchitectureCreatedFindingsSourcesOpenFromSearch,
} from "@/lib/architecture/architecture-created-findings-sources-disclosure-url";

/** Sources-only follow-ups for create-home Findings tab buyer-polished shell (REF). */
export function ArchitectureCreatedFindingsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureCreatedFindingsSourcesOpenParam = searchParams.get("architectureCreatedFindingsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseArchitectureCreatedFindingsSourcesOpenFromSearch(architectureCreatedFindingsSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        architectureCreatedFindingsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
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
    setSourcesOpenState(
      parseArchitectureCreatedFindingsSourcesOpenFromSearch(architectureCreatedFindingsSourcesOpenParam),
    );
  }, [architectureCreatedFindingsSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE}
      summaryLine={ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_SOURCES_INTRO}
      sectionTestId={ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="architecture-findings-sources"
        headingId="architecture-findings-sources-heading"
        title={ARCHITECTURE_CREATED_FINDINGS_FOLLOW_UPS_TITLE}
        intro={ARCHITECTURE_CREATED_FINDINGS_ORIENTATION_SOURCES_INTRO}
        links={ARCHITECTURE_CREATED_FINDINGS_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
