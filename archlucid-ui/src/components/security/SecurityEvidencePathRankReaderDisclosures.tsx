"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { formatSecurityEvidencePathRankReaderSentence } from "@/lib/security-evidence-path-rank-reader-sentence";
import { formatSecurityEvidencePathCompositeSortKeyLine } from "@/lib/security-evidence-path-rank-display";
import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

export function SecurityEvidencePathRankReaderDisclosures(props: {
  readonly rank: Pick<
    SecurityEvidencePathRankSummary,
    | "pathId"
    | "explanationSummary"
    | "technicalExposureScore"
    | "privilegeDepthScore"
    | "blastRadiusScore"
    | "businessConsequenceScore"
    | "compositeSortScore"
  >;
}) {
  const [ruleOpen, setRuleOpen] = useState(false);
  const [sortKeyOpen, setSortKeyOpen] = useState(false);
  const sentence = formatSecurityEvidencePathRankReaderSentence(props.rank);

  return (
    <div className="space-y-1" data-testid={`security-evidence-path-rank-reader-disclosures-${props.rank.pathId}`}>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid={`security-evidence-path-rank-reader-${props.rank.pathId}`}>
        {sentence}
      </p>
      <button
        type="button"
        aria-expanded={ruleOpen}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`security-evidence-path-rank-rule-${props.rank.pathId}`}
        onClick={() => setRuleOpen((current) => !current)}
      >
        {ruleOpen ? "Hide rule line" : "Show rule line"}
      </button>
      {ruleOpen ? <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{props.rank.explanationSummary}</p> : null}
      <button
        type="button"
        aria-expanded={sortKeyOpen}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`security-evidence-path-rank-sort-key-${props.rank.pathId}`}
        onClick={() => setSortKeyOpen((current) => !current)}
      >
        {sortKeyOpen ? "Hide sort key" : "Show sort key"}
      </button>
      {sortKeyOpen ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {formatSecurityEvidencePathCompositeSortKeyLine(props.rank.compositeSortScore)}
        </p>
      ) : null}
    </div>
  );
}
