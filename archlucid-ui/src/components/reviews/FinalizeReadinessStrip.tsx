"use client";

import { cn } from "@/lib/utils";

import { FinalizeReadinessBlockList } from "@/components/reviews/FinalizeReadinessBlockList";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { StatusTag } from "@/components/ui/status-tag";
import { renderDoThisNextReferenceCopy } from "@/lib/usability/do-this-next-reference-copy";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

export type FinalizeReadinessStripProps = {
  readonly runId?: string;
  readonly commitBlockedReason: string | null | undefined;
  readonly commitBlockedBlocks?: readonly FinalizeReadinessBlock[];
  readonly readinessLoading?: boolean;
};

/** Surfaces server-side finalize blockers before the operator opens the finalize dialog. */
export function FinalizeReadinessStrip(props: FinalizeReadinessStripProps): React.JSX.Element | null {
  if (props.readinessLoading === true) {
    return (
      <div
        className={cn(DESIGN_TOKENS.callout.warnShell, "mb-3 flex-col gap-2")}
        data-testid="finalize-readiness-strip-loading"
        role="status"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Checking finalize readiness…
        </p>
      </div>
    );
  }

  const reason = props.commitBlockedReason?.trim() ?? "";
  const blocks = props.commitBlockedBlocks ?? [];

  if (reason.length === 0 && blocks.length === 0) {
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
      {blocks.length > 0 ? (
        <FinalizeReadinessBlockList blocks={blocks} runId={props.runId} />
      ) : reason.length > 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {renderDoThisNextReferenceCopy(reason)}
        </p>
      ) : null}
    </div>
  );
}
