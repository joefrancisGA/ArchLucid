"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import type { PreCommitGovernanceBlockView } from "@/lib/pre-commit-governance-block-problem";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { APPROVAL_GATE_LABEL } from "@/lib/usability/canonical-product-terms";

export type PreCommitGovernanceBlockPanelProps = {
  readonly runId: string;
  readonly block: PreCommitGovernanceBlockView;
};

function findingInspectHref(runId: string, findingId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`;
}

/** Structured pre-commit governance block surfaced after finalize returns HTTP 409. */
export function PreCommitGovernanceBlockPanel(props: PreCommitGovernanceBlockPanelProps): React.JSX.Element {
  const { runId, block } = props;

  const troubleshootingHref = inAppHelpHref("troubleshooting", "governance-pre-commit-blocked");

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/35 bg-neutral-50 px-3 py-2 dark:border-amber-700/45 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="pre-commit-governance-block-panel"
      role="alert"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind="blocked" label="Blocked" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{APPROVAL_GATE_LABEL}</span>
      </div>

      <p className="m-0 mt-2 text-neutral-700 dark:text-neutral-300">{block.reason}</p>

      {block.minimumBlockingSeverityLabel !== null ? (
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Minimum blocking severity:{" "}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {block.minimumBlockingSeverityLabel}
          </span>
        </p>
      ) : null}

      {block.policyPackId !== null ? (
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Enforcing policy pack:{" "}
          <Link
            href={policyPacksEditHref(block.policyPackId)}
            className={cn("font-mono font-medium", OPERATOR_LINK.nav)}
            data-testid="pre-commit-governance-block-policy-pack-link"
          >
            {block.policyPackId}
          </Link>
        </p>
      ) : null}

      {block.blockingFindingIds.length > 0 ? (
        <div className="mt-2">
          <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            Blocking findings ({block.blockingFindingIds.length})
          </p>
          <ul className="m-0 mt-1 list-none space-y-1 p-0">
            {block.blockingFindingIds.map((findingId) => (
              <li key={findingId}>
                <Link
                  href={findingInspectHref(runId, findingId)}
                  className={cn("font-mono font-medium", OPERATOR_LINK.nav)}
                  data-testid={`pre-commit-governance-block-finding-link-${findingId}`}
                >
                  {findingId}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {block.blockExplanation !== null ? (
        <div
          className="mt-3 rounded border border-neutral-200 bg-white px-2 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          data-testid="pre-commit-governance-block-explanation"
        >
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
            AI-assisted: why governance blocked finalization
          </p>
          <p className={cn("m-0 mt-1 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {block.blockExplanation}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-1">
        <Link
          href={policyPacksEditHref(block.policyPackId ?? "")}
          className={OPERATOR_LINK.nav}
          data-testid="pre-commit-governance-block-review-policy-link"
        >
          Review effective policy →
        </Link>
        <Link
          href={troubleshootingHref}
          className={OPERATOR_LINK.nav}
          data-testid="pre-commit-governance-block-troubleshooting-link"
        >
          Governance bypass and override guidance →
        </Link>
        <Link
          href={GOVERNANCE_WORKSPACE_HEALTH_HREF}
          className={OPERATOR_LINK.nav}
          data-testid="pre-commit-governance-block-audit-link"
        >
          View governance bypass audit →
        </Link>
      </div>
    </div>
  );
}
