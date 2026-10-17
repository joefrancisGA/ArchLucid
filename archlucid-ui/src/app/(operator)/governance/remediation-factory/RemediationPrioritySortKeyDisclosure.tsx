"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { formatRemediationPrioritySortKeyLine } from "@/lib/remediation-priority-score-display";
import { cn } from "@/lib/utils";

export function RemediationPrioritySortKeyDisclosure(props: {
  readonly findingId: string;
  readonly totalScore: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`remediation-priority-sort-key-${props.findingId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide sort key" : "Show sort key"}
      </button>
      {open ? (
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {formatRemediationPrioritySortKeyLine(props.totalScore)}
        </p>
      ) : null}
    </div>
  );
}
