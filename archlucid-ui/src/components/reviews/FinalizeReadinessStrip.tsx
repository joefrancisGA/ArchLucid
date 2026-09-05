"use client";

import { cn } from "@/lib/utils";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { StatusTag } from "@/components/ui/status-tag";
import { renderDoThisNextReferenceCopy } from "@/lib/usability/do-this-next-reference-copy";

export type FinalizeReadinessStripProps = {
  readonly commitBlockedReason: string | null | undefined;
};

/** Surfaces server-side finalize blockers before the operator opens the finalize dialog. */
export function FinalizeReadinessStrip(props: FinalizeReadinessStripProps): React.JSX.Element | null {
  const reason = props.commitBlockedReason?.trim() ?? "";

  if (reason.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.warnShell, "mb-3 flex-col gap-2")}
      data-testid="finalize-readiness-strip"
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Finalize is blocked until you resolve the following
        </p>
        <StatusTag kind="blocked" label="Blocked" />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {renderDoThisNextReferenceCopy(reason)}
      </p>
    </div>
  );
}
