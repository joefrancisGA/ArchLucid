"use client";

import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { EnterpriseInlineErrorNotification } from "@/components/EnterpriseInlineErrorNotification";
import { GovernanceFindingsBuyerChrome } from "@/components/governance/findings/GovernanceFindingsBuyerChrome";
import { GovernanceFindingsAssignedToMeBuyerChrome } from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeBuyerChrome";
import { GovernanceFindingsQueueNextReviewFooterClient } from "@/components/governance/findings/GovernanceFindingsQueueNextReviewFooterClient";
import { GovernanceFindingsRelatedQueuesDisclosure } from "@/components/governance/findings/GovernanceFindingsRelatedQueuesDisclosure";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  BUYER_RISK_REGISTER_EMPTY_BODY,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
  BUYER_RISK_REGISTER_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import {
  buildGovernanceAssignedToMeEmptyDescription,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL,
} from "@/lib/governance/governance-assigned-to-me-empty-state";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export function GovernanceFindingsQueueOutcomeSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  return (
    <>
      {!props.loading && props.rows.length === 0 && props.loadFailed ? (
        <EnterpriseInlineErrorNotification
          testId={props.loadFailedPreset.testId}
          title={
            props.isAssignedToMe && props.buyerPolishedShell
              ? "Could not load your assigned findings"
              : !props.isAssignedToMe && props.buyerPolishedShell
                ? "Could not load findings for this workspace"
                : props.loadFailedPreset.title
          }
          description={
            props.isAssignedToMe && props.buyerPolishedShell
              ? "Your assigned findings did not load. Existing assignments are unchanged — retry the load or check connectivity before navigating away."
              : !props.isAssignedToMe && props.buyerPolishedShell
                ? "The findings queue did not load. Your existing findings are unchanged — retry the load or check connectivity before navigating away."
                : props.loadFailedPreset.description
          }
          onRetry={() => {
            props.onRefresh();
          }}
          diagnostics={
            props.loadFailure === null
              ? null
              : {
                  attemptedAtUtc: props.loadFailure.attemptedAtUtc,
                  correlationId: props.loadFailure.correlationId,
                  errorCode: props.loadFailure.errorCode,
                  httpStatus: props.loadFailure.httpStatus,
                }
          }
          reportProblem={{
            surfaceId: "governance-findings-queue-hard-failure",
            errorTitle: props.pageTitle,
            errorCode: props.loadFailure?.errorCode ?? "governance-findings-load-failed",
            correlationId: props.loadFailure?.correlationId ?? null,
            httpStatus: props.loadFailure?.httpStatus ?? null,
          }}
        />
      ) : null}

      {!props.loading && props.rows.length === 0 && !props.loadFailed ? (
        props.workspaceScopeTeaching !== null ? (
          <WorkspaceScopeEmptyTeaching
            title={props.workspaceScopeTeaching.title}
            body={props.workspaceScopeTeaching.body}
            ctaLabel={props.workspaceScopeTeaching.ctaLabel}
          />
        ) : (
          <EnterpriseCompactEmptyState
            testId="governance-findings-empty-state"
            title={
              props.isAssignedToMe
                ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT.title
                : props.buyerPolishedShell
                  ? BUYER_RISK_REGISTER_EMPTY_TITLE
                  : ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE
            }
            description={
              props.isAssignedToMe
                ? buildGovernanceAssignedToMeEmptyDescription({
                    assigneeDisplayName: props.currentPrincipalName,
                    assigneeRoleLabel: props.currentPrincipalRole,
                    checkedAt: props.assignedToMeCheckedAt,
                    fetchBasis: props.assignedToMeFetchBasis,
                  })
                : props.buyerPolishedShell
                  ? BUYER_RISK_REGISTER_EMPTY_BODY
                  : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
            }
            actions={
              props.isAssignedToMe
                ? undefined
                : [
                    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
                    {
                      label: props.buyerPolishedShell
                        ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION
                        : "Open approval",
                      href: "/governance/approval-queue",
                      variant: "outline",
                    },
                  ]
            }
            footer={
              props.isAssignedToMe ? (
                <Button asChild size="sm" variant="primary">
                  <Link href={GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF}>
                    {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL}
                  </Link>
                </Button>
              ) : !props.buyerPolishedShell ? (
                <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                  View policy packs
                </Link>
              ) : undefined
            }
          />
        )
      ) : null}

      {props.isAssignedToMe ? (
        <GovernanceFindingsRelatedQueuesDisclosure
          capabilitySurfaceId="assignedFindings"
          jobRouterCurrentJobId={props.currentJobId}
        />
      ) : null}

      {!props.isAssignedToMe && props.buyerPolishedShell ? (
        <GovernanceFindingsBuyerChrome scopedRunId={props.scopedRunId} />
      ) : null}

      {props.isAssignedToMe && props.buyerPolishedShell ? (
        <GovernanceFindingsAssignedToMeBuyerChrome />
      ) : null}

      {props.scopedRunFilterActive && props.scopedRunId !== null ? (
        <GovernanceFindingsQueueNextReviewFooterClient runId={props.scopedRunId} />
      ) : null}
    </>
  );
}
