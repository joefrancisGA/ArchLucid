"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PostCommitAdvancedAnalysisHint } from "@/components/PostCommitAdvancedAnalysisHint";
import { BUYER_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRunAdvancedAnalysisOpenFromSearch,
  runAdvancedAnalysisDisclosureHrefFromSearch} from "@/lib/runs/run-advanced-analysis-disclosure-url";

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
  const [open, setOpenState] = useState(() =>
    parseRunAdvancedAnalysisOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runAdvancedAnalysisOpen"),
    ),
  );

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
      if (open === detailsOpen) {
        return;
      }

      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [open, syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      setOpenState((current) => {
        const next = parseRunAdvancedAnalysisOpenFromSearch(
          new URLSearchParams(window.location.search).get("runAdvancedAnalysisOpen"),
        );

        return current === next ? current : next;
      });
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  const title = buyerPolishedArtifactTable ? BUYER_TECHNICAL_APPENDIX_LABEL : "Deep dive (technical analysis)";

  return (
    <section id="advanced-analysis" className="scroll-mt-24">
      <CollapsibleSection title={title} open={open} onToggle={setOpen}>
        <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
      </CollapsibleSection>
    </section>
  );
}
