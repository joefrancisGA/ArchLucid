import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { buildArchitectureActivityFinalizeReadinessHref } from "@/lib/architecture/architecture-created-finalize-readiness-href";
import { formatActionActorName } from "@/lib/action-actor-display";
import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import {
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_APPROVAL_GATE_LABEL,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_APPROVAL_GATE_VALUE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_BODY,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE_HEADING,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_GOVERNANCE_WARNINGS_BODY,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_GOVERNANCE_WARNINGS_TITLE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES_INTRO,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_PRIMARY_CTA,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SECONDARY_CTA,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_TITLE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_WHAT_HAPPENS_NEXT_HEADING,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_WHAT_HAPPENS_NEXT_STEPS,
} from "@/lib/runs/run-detail-governance-pre-commit-copy";
import {
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE,
  RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES,
} from "@/lib/runs/run-detail-governance-sources";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import { shouldShowRunDetailGovernanceCta, runDetailGovernanceWorkflowHref } from "@/lib/runs/run-detail-governance-cta-visibility";

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
  /** When the review package Do-this-next strip owns the page primary, demote in-section CTAs to outline. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** Dedicated governance decision state for the review workspace. */
export function RunDetailGovernanceDecisionSection(
  props: RunDetailGovernanceDecisionSectionProps,
): React.JSX.Element {
  const pagePrimaryOwnedElsewhere = props.pagePrimaryOwnedElsewhere === true;
  const decision = (props.operatorGovernanceDecision ?? "").trim();
  const rationale = (props.operatorGovernanceDecisionRationale ?? "").trim();
  const decisionBy = formatActionActorName(props.operatorGovernanceDecisionByUserId);
  const manifestFinalized = (props.manifestId ?? "").trim().length > 0;
  const showGovernanceCta = shouldShowRunDetailGovernanceCta({
    manifestId: props.manifestId,
    buyerPolishedArtifactTable: props.buyerPolishedArtifactTable,
    operatorGovernanceDecision: props.operatorGovernanceDecision,
    manifestStatus: props.manifestStatus,
  });

  if (!manifestFinalized) {
    const findingsHref = buildReviewWorkspaceTabHref(props.runId, "findings", {
      includeCreateIntent: true,
    });
    const activityHref = buildReviewWorkspaceTabHref(props.runId, "activity", {
      includeCreateIntent: true,
    });
    const finalizeReadinessHref = buildArchitectureActivityFinalizeReadinessHref(props.runId);

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

          {props.hasGovernanceWarnings ? (
            <div
              className={cn(DESIGN_TOKENS.callout.warn, "mt-4 px-4 py-3")}
              role="alert"
              data-testid="run-detail-governance-warning-banner"
            >
              <p className="m-0 font-semibold">{RUN_DETAIL_GOVERNANCE_PRE_COMMIT_GOVERNANCE_WARNINGS_TITLE}</p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
                {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_GOVERNANCE_WARNINGS_BODY}
              </p>
            </div>
          ) : null}

          <dl className={cn("m-0 mt-4 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
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
                  <StatusTag kind="needs-attention" label="Needs attention" />
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">
                {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_APPROVAL_GATE_LABEL}
              </dt>
              <dd className="m-0 mt-1 font-medium text-neutral-900 dark:text-neutral-100">
                {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_APPROVAL_GATE_VALUE}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_WHAT_HAPPENS_NEXT_HEADING}
            </h3>
            <ol className={cn("m-0 mt-2 list-decimal space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_WHAT_HAPPENS_NEXT_STEPS.map((step) => (
                <li key={step} className="text-neutral-700 dark:text-neutral-300">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant={pagePrimaryOwnedElsewhere ? "outline" : "default"}
              data-testid="run-detail-governance-primary-cta"
            >
              <Link href={finalizeReadinessHref}>{RUN_DETAIL_GOVERNANCE_PRE_COMMIT_PRIMARY_CTA}</Link>
            </Button>
            <Link
              href={activityHref}
              className={cn(OPERATOR_LINK.inline, "text-sm font-medium")}
              data-testid="run-detail-governance-secondary-cta"
            >
              {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SECONDARY_CTA}
            </Link>
          </div>

          <div className="mt-4" data-testid="run-detail-governance-help-cites">
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES_INTRO}
            </p>
            <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link className={OPERATOR_LINK.inline} href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside
          className={cn(operatorSemanticSurface("info"), "p-3")}
          data-testid="run-detail-governance-claim-discipline"
        >
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE_HEADING}
          </h3>
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
        : "No approval decision recorded";

  const findingsHref = buildReviewWorkspaceTabHref(props.runId, "findings");
  const decisionSecondaryViewPresentation = buildCanonicalObjectSecondaryView(
    "decision",
    "reviewPackageGovernanceTab",
    {},
  );

  return (
    <section
      id="governance-decision"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-governance-decision"
    >
      <CanonicalObjectSecondaryViewStrip
        presentation={decisionSecondaryViewPresentation}
        testId="review-governance-secondary-view-strip"
        className="mb-3"
      />
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        Approval decision
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
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Decision owner</dt>
          <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">{decisionBy}</dd>
        </div>
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
          No approval decision recorded
        </p>
      )}
      {showGovernanceCta ? (
        <div className="mt-4">
          <Button
            asChild
            variant={pagePrimaryOwnedElsewhere ? "outline" : "default"}
            data-testid="run-detail-governance-record-decision-cta"
          >
            <Link href={runDetailGovernanceWorkflowHref(props.runId)}>Record approval decision</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
