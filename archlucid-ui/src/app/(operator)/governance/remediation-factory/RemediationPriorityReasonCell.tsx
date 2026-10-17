"use client";

import { useState } from "react";

import { EnterpriseTableCell } from "@/components/ui/enterprise-table";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { formatRemediationPriorityReaderSentence } from "@/lib/remediation-priority-reader-sentence";
import { cn } from "@/lib/utils";

export function RemediationPriorityReasonCell(props: {
  readonly findingId: string;
  readonly breakdownJson: string;
  readonly explanationSummary: string;
}) {
  const [open, setOpen] = useState(false);
  const sentence = formatRemediationPriorityReaderSentence(props.breakdownJson);

  return (
    <EnterpriseTableCell>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid={`remediation-priority-reason-${props.findingId}`}>
        {sentence}
      </p>
      <button
        type="button"
        aria-expanded={open}
        className={cn("mt-1 border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`remediation-priority-rule-${props.findingId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide rule line" : "Show rule line"}
      </button>
      {open ? <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{props.explanationSummary}</p> : null}
    </EnterpriseTableCell>
  );
}
