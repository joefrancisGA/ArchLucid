"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  buildProvenanceSources,
  PROVENANCE_FOLLOW_UPS_TITLE,
  PROVENANCE_ORIENTATION_SOURCES_INTRO,
} from "@/lib/provenance-evidence-copy";
import { PROVENANCE_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/provenance-page-copy";
import {
  parseProvenanceSourcesOpenFromSearch,
  provenanceSourcesDisclosureHrefFromSearch,
} from "@/lib/provenance/provenance-sources-disclosure-url";

export type ProvenanceSourcesOrientationStripProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
};

/** Sources-only follow-ups for `/architecture/reviews/[reviewId]/provenance` buyer-polished shell (RRP). */
export function ProvenanceSourcesOrientationStrip(props: ProvenanceSourcesOrientationStripProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const provenanceSourcesOpenParam = searchParams.get("provenanceSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseProvenanceSourcesOpenFromSearch(provenanceSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(provenanceSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseProvenanceSourcesOpenFromSearch(provenanceSourcesOpenParam));
  }, [provenanceSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={PROVENANCE_FOLLOW_UPS_TITLE}
      summaryLine={PROVENANCE_ORIENTATION_SOURCES_INTRO}
      sectionTestId={PROVENANCE_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="provenance-settings-sources"
        headingId="provenance-settings-sources-heading"
        title={PROVENANCE_FOLLOW_UPS_TITLE}
        intro={PROVENANCE_ORIENTATION_SOURCES_INTRO}
        links={buildProvenanceSources(props.runId, props.architectureId, { workingMode: isWorkingMode })}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
