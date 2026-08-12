"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  deriveGovernanceLineageVersionAssertion,
  governanceApprovalStatusTagPresentation,
  governanceLineageReviewCheckpointStatusTagPresentation,
  type GovernanceLineageSpineStep,
} from "@/lib/governance/governance-lineage-presentation";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

type GovernanceApprovalLineageSpineProps = {
  readonly data: GovernanceLineageResult;
};

function buildSpineSteps(data: GovernanceLineageResult): readonly GovernanceLineageSpineStep[] {
  const steps: GovernanceLineageSpineStep[] = [];
  const approvalStatus = governanceApprovalStatusTagPresentation(data.approvalRequest.status);

  if (data.run) {
    steps.push({
      id: "review-checkpoint",
      title: "Architecture review checkpoint",
      detail: data.run.status.trim().length > 0 ? data.run.status : "Status unavailable",
      statusTag: governanceLineageReviewCheckpointStatusTagPresentation(data.run.status),
    });
  }

  steps.push({
    id: "signed-review-record",
    title: "Signed review record",
    detail: data.manifest ? "Linked to this approval" : "No signed review record linked",
    statusTag: data.manifest ? { kind: "ready", label: "Linked" } : { kind: "needs-attention", label: "Missing" },
  });

  steps.push({
    id: "governance-approval",
    title: "Governance approval",
    detail: data.approvalRequest.reviewedBy
      ? `Reviewed by ${data.approvalRequest.reviewedBy}`
      : "Awaiting reviewer action",
    statusTag: approvalStatus,
  });

  if (data.promotions.length > 0) {
    const latestPromotion = data.promotions[0]!;

    steps.push({
      id: "promotion",
      title: "Promotion",
      detail: `Promoted by ${latestPromotion.promotedBy}`,
      statusTag: { kind: "approved", label: "Recorded" },
    });
  } else {
    steps.push({
      id: "promotion",
      title: "Promotion",
      detail: "No promotion recorded",
      statusTag: { kind: "neutral", label: "Not promoted" },
    });
  }

  return steps;
}

export function GovernanceApprovalLineageSpine(props: GovernanceApprovalLineageSpineProps): React.JSX.Element {
  const versionAssertion = deriveGovernanceLineageVersionAssertion(props.data);
  const steps = buildSpineSteps(props.data);

  return (
    <section
      aria-labelledby="approval-lineage-spine-heading"
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="approval-lineage-spine"
    >
      <h2
        id="approval-lineage-spine-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Lineage chain
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {versionAssertion.primaryVersion !== null ? (
          <>
            Signed review record version{" "}
            <span className="font-mono text-al-text-primary">{versionAssertion.primaryVersion}</span>
            {" · "}
          </>
        ) : null}
        {versionAssertion.assertionLabel}
      </p>
      <ol className="m-0 mt-4 list-none space-y-0 p-0">
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0" data-testid={`approval-lineage-spine-step-${step.id}`}>
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs font-medium text-al-text-secondary dark:border-neutral-600 dark:bg-neutral-950"
              >
                {index + 1}
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="mt-1 w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{step.title}</span>
                {step.statusTag ? (
                  <StatusTag kind={step.statusTag.kind} label={step.statusTag.label} />
                ) : null}
              </div>
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      {versionAssertion.approvedAndPromotedMatch !== null ? (
        <p
          className={cn("m-0 mt-2", OPERATOR_NAV_GROUP_LABEL, "text-al-text-secondary")}
          data-testid="approval-lineage-version-match-assertion"
        >
          {versionAssertion.approvedAndPromotedMatch ? "Version match: yes" : "Version match: no"}
        </p>
      ) : null}
    </section>
  );
}
