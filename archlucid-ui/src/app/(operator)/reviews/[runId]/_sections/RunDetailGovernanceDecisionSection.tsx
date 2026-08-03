import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";
import {
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_BODY,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_PRIMARY_CTA,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SECONDARY_CTA,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_TITLE,
} from "@/lib/run-detail-governance-pre-commit-copy";
import {
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES,
} from "@/lib/run-detail-governance-sources";
import { shouldShowRunDetailGovernanceCta, runDetailGovernanceWorkflowHref } from "@/lib/run-detail-governance-cta-visibility";

export type RunDetailGovernanceDecisionSectionProps = {
  readonly runId: string;
  readonly manifestId: string | null | undefined;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly operatorGovernanceDecisionRationale: string | null | undefined;
  readonly operatorGovernanceDecisionUtc: string | null | undefined;
  readonly operatorGovernanceDecisionByUserId: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly governanceGateLabel: string | null;
  readonly blockingFindingCount: number;
  readonly hasGovernanceWarnings: boolean;
};

/** Dedicated governance decision state for the review workspace. */
export function RunDetailGovernanceDecisionSection(
  props: RunDetailGovernanceDecisionSectionProps,
): React.JSX.Element {
  const decision = (props.operatorGovernanceDecision ?? "").trim();
  const rationale = (props.operatorGovernanceDecisionRationale ?? "").trim();
  const decisionBy = (props.operatorGovernanceDecisionByUserId ?? "").trim();
  const manifestFinalized = (props.manifestId ?? "").trim().length > 0;
  const showGovernanceCta = shouldShowRunDetailGovernanceCta({
    manifestId: props.manifestId,
    buyerPolishedArtifactTable: props.buyerPolishedArtifactTable,
    operatorGovernanceDecision: props.operatorGovernanceDecision,
    manifestStatus: props.manifestStatus,
  });

  if (!manifestFinalized) {
    const findingsHref = buildArchitectureWorkspaceTabHref(props.runId, "findings");
    const activityHref = buildArchitectureWorkspaceTabHref(props.runId, "activity");

    return (
      <section
        id="governance-decision"
        className="scroll-mt-24 space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="run-detail-governance-decision"
        data-package-committed="false"
      >
        <div>
          <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
            {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_TITLE}
          </h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_BODY}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button asChild data-testid="run-detail-governance-primary-cta">
              <Link href={findingsHref}>{RUN_DETAIL_GOVERNANCE_PRE_COMMIT_PRIMARY_CTA}</Link>
            </Button>
            <Link
              href={activityHref}
              className={cn(OPERATOR_LINK.inline, "text-sm font-medium")}
              data-testid="run-detail-governance-secondary-cta"
            >
              {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SECONDARY_CTA}
            </Link>
          </div>
        </div>

        <section
          className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          aria-labelledby="run-detail-governance-sources-heading"
          data-testid="run-detail-governance-sources"
        >
          <h3
            id="run-detail-governance-sources-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Sources for governance proof
          </h3>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Open findings and governance help before treating this create-home tab as a decision or approval record.
            After finalize, use the committed decisions surface instead.
          </p>
          <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside
          className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="run-detail-governance-claim-discipline"
        >
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h3>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
            {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE}
          </p>
        </aside>
      </section>
    );
  }

  const decisionState =
    decision.length > 0
      ? decision
      : manifestFinalized
        ? props.governanceGateLabel ?? "Awaiting decision"
        : "No governance decision recorded";

  const findingsHref = buildArchitectureWorkspaceTabHref(props.runId, "findings");

  return (
    <section
      id="governance-decision"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-governance-decision"
    >
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        Governance decision
      </h2>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Current decision state</dt>
          <dd className="m-0 mt-1">
            {decision.length > 0 ? (
              <StatusTag
                kind={/reject/i.test(decision) ? "blocked" : /approv/i.test(decision) ? "approved" : "neutral"}
                label={decision}
              />
            ) : (
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{decisionState}</span>
            )}
          </dd>
        </div>
        {decisionBy.length > 0 ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Decision owner</dt>
            <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">{decisionBy}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Blocking findings</dt>
          <dd className="m-0 mt-1 font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
            {props.blockingFindingCount > 0 ? (
              <Link href={findingsHref} className={cn(OPERATOR_LINK.inline, "font-medium tabular-nums")}>
                {props.blockingFindingCount}
              </Link>
            ) : (
              "None"
            )}
          </dd>
        </div>
        {props.hasGovernanceWarnings ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Open exceptions</dt>
            <dd className="m-0 mt-1">
              <StatusTag kind="needs-attention" label="Monitoring active" />
            </dd>
          </div>
        ) : null}
      </dl>
      {rationale.length > 0 ? (
        <div className="mt-3">
          <p className={cn("m-0 mb-1 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Latest decision note
          </p>
          <p className={cn("m-0 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {rationale}
          </p>
        </div>
      ) : (
        <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          No governance decision recorded
        </p>
      )}
      {showGovernanceCta ? (
        <div className="mt-4">
          <Button asChild>
            <Link href={runDetailGovernanceWorkflowHref(props.runId)}>Record governance decision</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
