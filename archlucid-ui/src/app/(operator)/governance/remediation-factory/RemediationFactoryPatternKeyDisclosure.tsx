"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

export function RemediationFactoryPatternKeyDisclosure(props: {
  readonly findingId: string;
  readonly patternKey: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        aria-expanded={open}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`remediation-priority-pattern-identifiers-${props.findingId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide identifiers" : "Show identifiers"}
      </button>
      {open ? (
        <p
          className={cn("m-0 mt-1 font-mono text-xs break-all", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`remediation-priority-pattern-key-${props.findingId}`}
        >
          Pattern key: {props.patternKey}
        </p>
      ) : null}
    </div>
  );
}
