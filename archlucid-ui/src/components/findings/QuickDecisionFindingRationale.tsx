"use client";

import type { ReactElement } from "react";

import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { findingCausalMiniChainFromQuickDecisionFinding } from "@/lib/finding-causal-mini-chain";
import { findingDerivationFromQuickDecisionFinding } from "@/lib/finding-derivation-sentence";
import { getFindingEvidenceTraceHref } from "@/lib/finding-evidence-navigation";
import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type QuickDecisionFindingRationaleProps = {
  readonly runId: string;
  readonly finding: QuickDecisionFinding;
};

/** How the finding was derived, its causal chain, and the sponsor-facing plain-English restatement. */
export function QuickDecisionFindingRationale(
  props: QuickDecisionFindingRationaleProps,
): ReactElement {
  const finding = props.finding;
  const derivation = findingDerivationFromQuickDecisionFinding(finding);

  return (
    <>
      <FindingDerivationLine
        derivation={derivation}
        evidenceHref={getFindingEvidenceTraceHref(props.runId, finding.findingId)}
        testId={`finding-derivation-${finding.findingId}`}
      />
      <FindingCausalMiniChain
        chain={findingCausalMiniChainFromQuickDecisionFinding(finding)}
        className="mt-2"
      />
      <SponsorPlainEnglishFindingPanel
        input={{
          title: finding.title,
          message: finding.recommendation,
          severity: severityBadgeLabel(finding.severityValue),
          derivationSentence: derivation.sentence,
          residualRisk: null,
        }}
        testId={`sponsor-plain-english-${finding.findingId}`}
      />
    </>
  );
}
