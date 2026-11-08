"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { formatSecurityEvidencePathCompositeSortKeyLine } from "@/lib/security-evidence-path-rank-display";
import { cn } from "@/lib/utils";

export function SecurityEvidencePathRankSortKeyDisclosure(props: {
  readonly pathId: string;
  readonly compositeSortScore: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        className={cn("border border-border px-2", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`security-evidence-path-rank-sort-key-${props.pathId}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide sort key" : "Show sort key"}
      </button>
      {open ? (
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {formatSecurityEvidencePathCompositeSortKeyLine(props.compositeSortScore)}
        </p>
      ) : null}
    </div>
  );
}
