"use client";

import { useState } from "react";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE,
  shouldShowPathInspectLongPathIdHonesty,
} from "@/lib/product-line/path-inspect-long-path-id-honesty-copy";
import { formatAttackPathReportPathChipLabel } from "@/lib/remediation-factory/attack-path-report-path-chip-label";
import { formatSecurityEvidencePathCompositeSortKeyLine } from "@/lib/security-evidence-path-rank-display";
import { cn } from "@/lib/utils";

export function SecurityEvidencePathRankSortKeyDisclosure(props: {
  readonly pathId: string;
  readonly compositeSortScore: number | null;
}) {
  const [open, setOpen] = useState(false);
  const pathChipLabel = formatAttackPathReportPathChipLabel(props.pathId);

  return (
    <div>
      <p
        className={cn("m-0 font-mono text-xs", OPERATOR_TYPOGRAPHY.micro)}
        data-testid={`remediation-factory-ranked-path-id-${props.pathId}`}
        title={props.pathId}
      >
        {pathChipLabel}
      </p>
      {shouldShowPathInspectLongPathIdHonesty(props.pathId) ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`remediation-factory-ranked-path-id-overflow-${props.pathId}`}>
          {PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE}
        </p>
      ) : null}
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
