"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

export function RemediationPriorityResourceIdDisclosure(props: {
  readonly findingId: string;
  readonly cloudResourceId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`remediation-priority-resource-id-${props.findingId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide resource id" : "Show resource id"}
      </button>
      {open ? (
        <p className={cn("m-0 mt-1 break-all", OPERATOR_TYPOGRAPHY.helper)}>{props.cloudResourceId}</p>
      ) : null}
    </div>
  );
}
