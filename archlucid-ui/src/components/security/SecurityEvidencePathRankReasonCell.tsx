"use client";

import { useState } from "react";

import { EnterpriseTableCell } from "@/components/ui/enterprise-table";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { formatSecurityEvidencePathRankReaderSentence } from "@/lib/security-evidence-path-rank-reader-sentence";
import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

export function SecurityEvidencePathRankReasonCell(props: {
  readonly rank: Pick<
    SecurityEvidencePathRankSummary,
    | "pathId"
    | "explanationSummary"
    | "technicalExposureScore"
    | "privilegeDepthScore"
    | "blastRadiusScore"
    | "businessConsequenceScore"
  >;
}) {
  const [open, setOpen] = useState(false);
  const sentence = formatSecurityEvidencePathRankReaderSentence(props.rank);

  return (
    <EnterpriseTableCell>
      <p
        className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid={`security-evidence-path-rank-reader-${props.rank.pathId}`}
      >
        {sentence}
      </p>
      <button
        type="button"
        aria-expanded={open}
        className={cn("mt-1 border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`security-evidence-path-rank-rule-${props.rank.pathId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide rule line" : "Show rule line"}
      </button>
      {open ? <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{props.rank.explanationSummary}</p> : null}
    </EnterpriseTableCell>
  );
}
