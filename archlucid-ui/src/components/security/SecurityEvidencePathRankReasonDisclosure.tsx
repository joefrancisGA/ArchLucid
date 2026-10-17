"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { formatSecurityEvidencePathRankReaderSentence } from "@/lib/security-evidence-path-rank-reader-sentence";
import type { SecurityEvidencePathRankReaderInput } from "@/lib/security-evidence-path-rank-reader-sentence";
import { cn } from "@/lib/utils";

export function SecurityEvidencePathRankReasonDisclosure(props: {
  readonly pathId: string;
  readonly scores: SecurityEvidencePathRankReaderInput;
  readonly explanationSummary: string;
}) {
  const [open, setOpen] = useState(false);
  const sentence = formatSecurityEvidencePathRankReaderSentence(props.scores);

  return (
    <div>
      <p
        className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid={`security-evidence-path-rank-reason-${props.pathId}`}
      >
        {sentence}
      </p>
      <button
        type="button"
        aria-expanded={open}
        className={cn("mt-1 border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`security-evidence-path-rank-rule-${props.pathId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide rule line" : "Show rule line"}
      </button>
      {open ? <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{props.explanationSummary}</p> : null}
    </div>
  );
}
