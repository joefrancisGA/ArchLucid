"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchitectureCreatedEvidenceEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceEvidenceOrientationStrip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  architectureCreatedEvidenceSourcesDisclosureHrefFromSearch,
  parseArchitectureCreatedEvidenceSourcesOpenFromSearch,
} from "@/lib/architecture/architecture-created-evidence-sources-disclosure-url";
import { ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO } from "@/lib/architecture/architecture-created-evidence-sources";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Evidence workspace (REE). */
export function ArchitectureCreatedEvidenceBuyerChrome(): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const architectureCreatedEvidenceSourcesOpenParam = searchParams.get("architectureCreatedEvidenceSourcesOpen");
  const evalChromeShell = useProductionEvalChrome();
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
    setSourcesOpenState(parseArchitectureCreatedEvidenceSourcesOpenFromSearch(architectureCreatedEvidenceSourcesOpenParam));
  }, [architectureCreatedEvidenceSourcesOpenParam]);

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div data-testid="architecture-evidence-orientation-bottom" className={HELP_PAGE_LAYOUT.readingBody}>
      <CollapsibleSection
        title={EVALUATION_SOURCES_TITLE}
        summaryLine={ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO}
        sectionTestId="architecture-evidence-sources-disclosure"
        open={sourcesOpen}
        onToggle={setSourcesOpen}
      >
        <ArchitectureCreatedEvidenceEvidenceOrientationStrip part="sources" />
      </CollapsibleSection>
    </div>
  );
}
