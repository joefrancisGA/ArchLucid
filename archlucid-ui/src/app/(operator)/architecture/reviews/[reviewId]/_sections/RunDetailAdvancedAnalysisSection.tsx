"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PostCommitAdvancedAnalysisHint } from "@/components/PostCommitAdvancedAnalysisHint";
import { BUYER_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer/buyer-polish-copy";
import {
  parseRunAdvancedAnalysisOpenFromSearch,
  runAdvancedAnalysisDisclosureHrefFromSearch,
} from "@/lib/runs/run-advanced-analysis-disclosure-url";

type RunDetailAdvancedAnalysisSectionProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
};

/** Post-commit technical deep-dive; copy differs by buyer vs operator shell. */
export function RunDetailAdvancedAnalysisSection(
  props: RunDetailAdvancedAnalysisSectionProps,
): ReactElement {
  const { runId, buyerPolishedArtifactTable } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runAdvancedAnalysisOpenParam = searchParams.get("runAdvancedAnalysisOpen");
  const [open, setOpenState] = useState(() => parseRunAdvancedAnalysisOpenFromSearch(runAdvancedAnalysisOpenParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runAdvancedAnalysisDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunAdvancedAnalysisOpenFromSearch(runAdvancedAnalysisOpenParam));
  }, [runAdvancedAnalysisOpenParam]);

  const title = buyerPolishedArtifactTable ? BUYER_TECHNICAL_APPENDIX_LABEL : "Deep dive (technical analysis)";

  return (
    <section id="advanced-analysis" className="scroll-mt-24">
      <CollapsibleSection title={title} open={open} onToggle={setOpen}>
        <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
      </CollapsibleSection>
    </section>
  );
}
