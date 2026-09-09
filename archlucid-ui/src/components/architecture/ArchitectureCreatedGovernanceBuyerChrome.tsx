"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchitectureCreatedGovernanceEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceEvidenceOrientationStrip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  architectureCreatedGovernanceSourcesDisclosureHrefFromSearch,
  parseArchitectureCreatedGovernanceSourcesOpenFromSearch,
} from "@/lib/architecture/architecture-created-governance-sources-disclosure-url";
import { ARCHITECTURE_CREATED_GOVERNANCE_SOURCES_INTRO } from "@/lib/architecture/architecture-created-governance-sources";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Governance workspace (REG). */
export function ArchitectureCreatedGovernanceBuyerChrome(): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureCreatedGovernanceSourcesOpenParam = searchParams.get("architectureCreatedGovernanceSourcesOpen");
  const evalChromeShell = useProductionEvalChrome();
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
    setSourcesOpenState(parseArchitectureCreatedGovernanceSourcesOpenFromSearch(architectureCreatedGovernanceSourcesOpenParam));
  }, [architectureCreatedGovernanceSourcesOpenParam]);

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="architecture-governance-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <CollapsibleSection
        title={EVALUATION_SOURCES_TITLE}
        summaryLine={ARCHITECTURE_CREATED_GOVERNANCE_SOURCES_INTRO}
        sectionTestId="architecture-governance-sources-disclosure"
        open={sourcesOpen}
        onToggle={setSourcesOpen}
      >
        <ArchitectureCreatedGovernanceEvidenceOrientationStrip part="sources" />
      </CollapsibleSection>
    </div>
  );
}
