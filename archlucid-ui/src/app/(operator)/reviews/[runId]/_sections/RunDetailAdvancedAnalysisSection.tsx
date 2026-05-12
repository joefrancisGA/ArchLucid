import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PostCommitAdvancedAnalysisHint } from "@/components/PostCommitAdvancedAnalysisHint";

type RunDetailAdvancedAnalysisSectionProps = {
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
};

/** Post-commit technical deep-dive; copy differs by buyer vs operator shell. */
export function RunDetailAdvancedAnalysisSection(
  props: RunDetailAdvancedAnalysisSectionProps,
): ReactElement {
  const { runId, buyerPolishedArtifactTable } = props;

  if (buyerPolishedArtifactTable) {
    return (
      <section id="advanced-analysis" className="scroll-mt-24">
        <CollapsibleSection title="Advanced — package technical detail" defaultOpen={false}>
          <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
        </CollapsibleSection>
      </section>
    );
  }

  return (
    <section id="advanced-analysis" className="scroll-mt-24">
      <CollapsibleSection title="Deep dive (technical analysis)" defaultOpen={false}>
        <PostCommitAdvancedAnalysisHint runId={runId} embeddedInCollapsible />
      </CollapsibleSection>
    </section>
  );
}
