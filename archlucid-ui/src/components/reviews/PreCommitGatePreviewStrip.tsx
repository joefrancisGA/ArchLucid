"use client";

import type { ReactElement } from "react";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PreCommitGatePreviewView } from "@/lib/governance/pre-commit-gate-preview";
import { cn } from "@/lib/utils";

export type PreCommitGatePreviewStripProps = {
  readonly preview: PreCommitGatePreviewView;
  readonly className?: string;
};

/** In-place pre-commit block/warn preview beside the finalize CTA. */
export function PreCommitGatePreviewStrip(props: PreCommitGatePreviewStripProps): ReactElement {
  const { preview } = props;
  const shellClass =
    preview.disposition === "block"
      ? DESIGN_TOKENS.callout.warnShell
      : preview.disposition === "warn"
        ? DESIGN_TOKENS.callout.info
        : "rounded-md border border-emerald-600/30 bg-emerald-50/70 p-4 dark:border-emerald-700/40 dark:bg-emerald-950/20";

  return (
    <div
      className={cn(shellClass, "p-4", props.className)}
      data-testid={`pre-commit-gate-preview-${preview.disposition}`}
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{preview.title}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{preview.detail}</p>
      {preview.policyPackId !== null || preview.minimumBlockingSeverityLabel !== null ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {preview.policyPackId !== null ? `Pack: ${preview.policyPackId}` : null}
          {preview.policyPackId !== null && preview.minimumBlockingSeverityLabel !== null ? " · " : null}
          {preview.minimumBlockingSeverityLabel !== null
            ? `Threshold: ${preview.minimumBlockingSeverityLabel} or above`
            : null}
          {preview.blockingFindingCount > 0 ? ` · ${preview.blockingFindingCount} blocking finding(s)` : null}
        </p>
      ) : null}
    </div>
  );
}
