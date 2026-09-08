"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { StatusTag } from "@/components/ui/status-tag";
import {
  alertOperatorToolingOperatorRankLine,
  alertOperatorToolingReaderRankLine,
  alertsInboxRankOperatorLine,
  alertsInboxRankReaderLine,
  auditLogRankOperatorLine,
  auditLogRankReaderLine,
  enterpriseExecutePageHintReaderRank,
  enterpriseNavHintOperatorRank,
  enterpriseNavHintReaderRank,
  governanceDashboardReaderActionLine,
  governanceResolutionRankOperatorLine,
  governanceResolutionRankReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import {
  BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_BADGE,
  BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isCtoDemoPresenterSafeModeEnv } from "@/lib/cto-demo-presenter-pack";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const pageCueClassName =
  (cn("mb-2 max-w-3xl leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper));

/**
 * Second line under **Operate · governance** in the sidebar (legacy hook).
 * Copy is intentionally empty for all ranks — nav stays label-only; page cues remain on-route.
 */
export function OperateCapabilityNavGroupHint(): ReactNode {
  const rank = useNavCallerAuthorityRank();

  const text =
    rank < AUTHORITY_RANK.ExecuteAuthority ? enterpriseNavHintReaderRank : enterpriseNavHintOperatorRank;

  if (text.length === 0) {
    return null;
  }

  return (
    <span className={cn("mt-0.5 block max-w-[14rem] normal-case tracking-normal", OPERATOR_TYPOGRAPHY.navHelper)}>
      {text}
    </span>
  );
}

export type OperateExecutePageHintProps = {
  className?: string;
};

/**
 * One line for alert/governance **mutation** pages when the resolved principal is below Execute
 * (e.g. Reader bookmarked the URL). Hidden for operator/admin to avoid clutter.
 */
export function OperateExecutePageHint({ className }: OperateExecutePageHintProps): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (rank >= AUTHORITY_RANK.ExecuteAuthority) {
    return null;
  }

  return (
    <p className={cn(pageCueClassName, className)} role="note">
      {enterpriseExecutePageHintReaderRank}
    </p>
  );
}

/**
 * Policy resolution: rank-aware second line (read evidence vs where operators change policy).
 */
export function GovernanceResolutionRankCue({ className }: { className?: string }): ReactNode {
  const rank = useNavCallerAuthorityRank();

  const text =
    rank < AUTHORITY_RANK.ExecuteAuthority ? governanceResolutionRankReaderLine : governanceResolutionRankOperatorLine;

  return <p className={cn(pageCueClassName, className)} role="note">{text}</p>;
}

/**
 * Alerts inbox: reader view vs operator triage (mutations still API-gated).
 */
export function AlertsInboxRankCue({ className }: { className?: string }): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const text = rank < AUTHORITY_RANK.ExecuteAuthority ? alertsInboxRankReaderLine : alertsInboxRankOperatorLine;

  return <p className={cn(pageCueClassName, className)} role="note">{text}</p>;
}

/**
 * Audit log: reader evidence framing vs operator investigation framing.
 */
export function AuditLogRankCue({ className }: { className?: string }): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const text = rank < AUTHORITY_RANK.ExecuteAuthority ? auditLogRankReaderLine : auditLogRankOperatorLine;

  return <p className={cn(pageCueClassName, className)} role="note">{text}</p>;
}

/**
 * Alert rules, routing, simulation, tuning, composite rules: one rank-aware line (read vs operator/admin framing).
 */
export function AlertOperatorToolingRankCue({ className }: { className?: string }): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const text =
    rank < AUTHORITY_RANK.ExecuteAuthority ? alertOperatorToolingReaderRankLine : alertOperatorToolingOperatorRankLine;

  return <p className={cn(pageCueClassName, className)} role="note">{text}</p>;
}

/**
 * Approval dashboard: clarifies that in-product approvals still need execute on the API when rank is below operator.
 */
export function GovernanceDashboardReaderActionCue({ className }: { className?: string }): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (rank >= AUTHORITY_RANK.ExecuteAuthority) {
    return null;
  }

  return <p className={cn(pageCueClassName, className)} role="note">{governanceDashboardReaderActionLine}</p>;
}

export type OperateExecutePlusPageCueProps = {
  /** One line from `enterprise-controls-context-copy` */
  message: string;
  className?: string;
};

/**
 * Single muted line for operator/admin visitors on mutation-heavy Operate pages (hidden for Reader to avoid stacking with `OperateExecutePageHint`).
 */
export function OperateExecutePlusPageCue({ message, className }: OperateExecutePlusPageCueProps): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (rank < AUTHORITY_RANK.ExecuteAuthority) {
    return null;
  }

  return <p className={cn(pageCueClassName, className)} role="note">{message}</p>;
}

/**
 * Reader-tier CTO demo: explain that governance shows a completed approval story without mutation.
 */
export function CtoDemoGovernancePreviewHint({ className }: { className?: string }): ReactNode {
  const rank = useNavCallerAuthorityRank();

  if (!isBuyerPolishedOperatorShellEnv() || !isCtoDemoPresenterSafeModeEnv()) {
    return null;
  }

  if (rank >= AUTHORITY_RANK.ExecuteAuthority) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-4 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        className,
      )}
      data-testid="cto-demo-governance-preview-hint"
      role="note"
    >
      <StatusTag kind="needs-attention" label={BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_BADGE} />
      <p className={cn(pageCueClassName, "mb-0 mt-2")}>{BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE}</p>
    </div>
  );
}
