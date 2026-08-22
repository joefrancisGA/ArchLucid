"use client";

import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { EnterpriseTableCell } from "@/components/ui/enterprise-table";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareDiffExpandableValueCellProps = {
  readonly value: string | null;
  readonly monospace?: boolean;
};

export function CompareDiffExpandableValueCell(props: CompareDiffExpandableValueCellProps): ReactElement {
  const display = props.value ?? " — ";
  const [expanded, setExpanded] = useState(false);
  const needsExpansion = display.length > 96;

  if (!needsExpansion) {
    return (
      <EnterpriseTableCell className={props.monospace === true ? cn("font-mono", OPERATOR_TYPOGRAPHY.helper) : undefined}>
        {display}
      </EnterpriseTableCell>
    );
  }

  return (
    <EnterpriseTableCell className={props.monospace === true ? cn("font-mono", OPERATOR_TYPOGRAPHY.helper) : undefined}>
      <span className={expanded ? undefined : "line-clamp-2"}>{display}</span>
      <button
        type="button"
        className={cn("mt-1 block", OPERATOR_LINK.inline, OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY.helper)}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Show less" : "Show full value"}
      </button>
    </EnterpriseTableCell>
  );
}
