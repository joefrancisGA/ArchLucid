import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** WK-21 honesty: not every engine output is pack-parameterized policy enforcement. */
export const POLICY_PACK_INFLUENCE_HONESTY_LINE =
  "Pack-mapped findings cite assigned policy rules. Typed engines may surface checklist coverage without pack-parameterized thresholds." as const;

export type PolicyPackInfluenceHonestyChipProps = {
  readonly unmappedFindingCount?: number | null;
  readonly className?: string;
};

export const POLICY_PACK_UNMAPPED_FINDING_COUNT_NOT_STORED = "Unmapped finding count was not stored." as const;

export function PolicyPackInfluenceHonestyChip(props: PolicyPackInfluenceHonestyChipProps): ReactElement {
  const raw = props.unmappedFindingCount;
  const unmappedOmitted =
    raw === null ||
    raw === undefined ||
    (typeof raw === "number" && !Number.isFinite(raw));
  const unmappedCount =
    !unmappedOmitted && typeof raw === "number" ? Math.max(0, Math.trunc(raw)) : 0;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        props.className,
      )}
      data-testid="policy-pack-influence-honesty-chip"
      role="note"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind="neutral" label="Policy influence boundary" />
        {unmappedOmitted ? (
          <StatusTag kind="neutral" label={POLICY_PACK_UNMAPPED_FINDING_COUNT_NOT_STORED} />
        ) : unmappedCount > 0 ? (
          <StatusTag kind="needs-attention" label={`${unmappedCount} unmapped finding${unmappedCount === 1 ? "" : "s"}`} />
        ) : null}
      </div>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {POLICY_PACK_INFLUENCE_HONESTY_LINE}
      </p>
    </div>
  );
}
