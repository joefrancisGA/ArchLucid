"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES,
} from "@/lib/architecture/architecture-created-evidence-sources";
import {
  architectureCreatedEvidenceSourcesDisclosureHrefFromSearch,
  parseArchitectureCreatedEvidenceSourcesOpenFromSearch,
} from "@/lib/architecture/architecture-created-evidence-sources-disclosure-url";

/** Sources-only follow-ups for create-home Evidence tab buyer-polished shell (REE). */
export function ArchitectureCreatedEvidenceSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureCreatedEvidenceSourcesOpenParam = searchParams.get("architectureCreatedEvidenceSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseArchitectureCreatedEvidenceSourcesOpenFromSearch(architectureCreatedEvidenceSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        architectureCreatedEvidenceSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
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
      parseArchitectureCreatedEvidenceSourcesOpenFromSearch(architectureCreatedEvidenceSourcesOpenParam),
    );
  }, [architectureCreatedEvidenceSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE}
      summaryLine={ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_SOURCES_INTRO}
      sectionTestId={ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="architecture-evidence-sources"
        headingId="architecture-evidence-sources-heading"
        title={ARCHITECTURE_CREATED_EVIDENCE_FOLLOW_UPS_TITLE}
        intro={ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_SOURCES_INTRO}
        links={ARCHITECTURE_CREATED_EVIDENCE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
