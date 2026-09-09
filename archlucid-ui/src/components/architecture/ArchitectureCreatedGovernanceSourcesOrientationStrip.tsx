"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_CREATED_GOVERNANCE_SOURCES,
} from "@/lib/architecture/architecture-created-governance-sources";
import {
  architectureCreatedGovernanceSourcesDisclosureHrefFromSearch,
  parseArchitectureCreatedGovernanceSourcesOpenFromSearch,
} from "@/lib/architecture/architecture-created-governance-sources-disclosure-url";

/** Sources-only follow-ups for create-home Governance tab buyer-polished shell (REG). */
export function ArchitectureCreatedGovernanceSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureCreatedGovernanceSourcesOpenParam = searchParams.get("architectureCreatedGovernanceSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseArchitectureCreatedGovernanceSourcesOpenFromSearch(architectureCreatedGovernanceSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        architectureCreatedGovernanceSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
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
      parseArchitectureCreatedGovernanceSourcesOpenFromSearch(architectureCreatedGovernanceSourcesOpenParam),
    );
  }, [architectureCreatedGovernanceSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE}
      summaryLine={ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_SOURCES_INTRO}
      sectionTestId={ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="architecture-governance-sources"
        headingId="architecture-governance-sources-heading"
        title={ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE}
        intro={ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_SOURCES_INTRO}
        links={ARCHITECTURE_CREATED_GOVERNANCE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
