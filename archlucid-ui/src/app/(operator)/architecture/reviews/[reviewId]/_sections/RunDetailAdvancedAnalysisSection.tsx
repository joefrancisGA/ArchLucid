"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PostCommitAdvancedAnalysisHint } from "@/components/PostCommitAdvancedAnalysisHint";
import { BUYER_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  RUN_ADVANCED_ANALYSIS_OPEN_PARAM,
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
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlAdvancedAnalysisOpen = parseRunAdvancedAnalysisOpenFromSearch(
    searchParams.get(RUN_ADVANCED_ANALYSIS_OPEN_PARAM),
  );
  const [open, setOpenState] = useState(urlAdvancedAnalysisOpen);
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runAdvancedAnalysisDisclosureHrefFromSearch(window.location.search.slice(1), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseRunAdvancedAnalysisOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_ADVANCED_ANALYSIS_OPEN_PARAM),
      );

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    if (openRef.current === urlAdvancedAnalysisOpen) {
      return;
    }

    openRef.current = urlAdvancedAnalysisOpen;
    setOpenState(urlAdvancedAnalysisOpen);
  }, [urlAdvancedAnalysisOpen]);

  const title = buyerPolishedArtifactTable ? BUYER_TECHNICAL_APPENDIX_LABEL : "Deep dive (technical analysis)";

  return (
    <section id="advanced-analysis" className="scroll-mt-24">
      <CollapsibleSection title={title} open={open} onToggle={setOpen}>
        <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
      </CollapsibleSection>
    </section>
  );
}
