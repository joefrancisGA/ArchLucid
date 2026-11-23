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
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import {
  assignedToMeFindingsHref,
  buildGovernanceAssignedToMeEmptyDescription,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL,
} from "@/lib/governance/governance-assigned-to-me-empty-state";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";
import { usePathname } from "next/navigation";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import { resolveInhabitedFindingsEmptyStateCopy } from "@/lib/inhabit/inhabit-findings-document-presentation";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { GovernanceAssignedToMeBuildProvenanceStrip } from "@/app/(operator)/governance/findings/GovernanceAssignedToMeBuildProvenanceStrip";
import {
  INHABIT_FINDINGS_LIVE_RECOVERY_BODY,
  INHABIT_FINDINGS_LIVE_RECOVERY_TITLE,
  resolveInhabitFindingsLiveRecoveryActions,
} from "@/lib/inhabit/inhabit-live-recovery-contract";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { shouldShowSecureNowCollectionMissingBlock } from "@/lib/product-line/securenow-collection-missing-reason";
import { resolveSecureNowGovernanceFindingsEmptyStateCopy } from "@/lib/product-line/securenow-governance-findings-copy";
import { SecureNowCollectionPrimaryBlockerLine } from "@/components/product-line/SecureNowCollectionPrimaryBlockerLine";
import { SecureNowPartialCaptureRecoveryParagraph } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { useLatestPartialCaptureSnapshotId } from "@/hooks/use-latest-partial-capture-snapshot-id";
import { useSecureNowPartialCaptureReturnPath } from "@/hooks/use-securenow-partial-capture-return-path";
import { GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-empty-collection-blocker-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE } from "@/lib/governance/governance-findings-empty-collection-blocker-preface-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE } from "@/lib/governance/governance-assigned-to-me-empty-collection-blocker-preface-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-assigned-to-me-empty-collection-blocker-not-load-failure-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-assigned-to-me-empty-partial-capture-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-empty-partial-capture-not-load-failure-copy";
import { cn } from "@/lib/utils";
import { SECURENOW_FINDINGS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/product-line/securenow-findings-empty-partial-capture-copy";
import { RISK_REGISTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/risk-register-empty-not-load-failure-copy";

export function GovernanceFindingsQueueOutcomeSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  const pathname = usePathname();
  const { productLine } = useProductLine();
  const relativeFreshnessNowMs = useOperatorRelativeFreshnessNowMs();
  const loadRecovery = errorRecoveryContractForScenario("api-problem", {
    failureSummary: "Findings queue could not be loaded.",
    productLineId: productLine,
  });
  const inhabitedEmptyState = resolveInhabitedFindingsEmptyStateCopy({
    workingMode: props.isWorkingMode,
    pathname,
    scopedArchitectureId: props.scopedArchitectureId,
    architectureDisplayName: props.architectureDisplayName,
    scopedRunId: props.scopedRunId,
    scopedRunTitle: props.scopedRunContextTitle,
    productLineId: productLine,
  });
  const { collectionInput, isPending: collectionInputPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
    enabled: isSecureNowProductLine(productLine),
  });
  const secureNowCollectionMissing =
    collectionInput !== null && shouldShowSecureNowCollectionMissingBlock(collectionInput);
  const secureNowCaptureEvaluatedEmpty =
    collectionInput !== null && !secureNowCollectionMissing && !collectionInputPending;
  const secureNowEmptyState =
    isSecureNowProductLine(productLine)
      ? resolveSecureNowGovernanceFindingsEmptyStateCopy({
          collectionMissing: secureNowCollectionMissing,
          captureEvaluatedEmpty: secureNowCaptureEvaluatedEmpty,
        })
      : null;
  const assignedCollectionMissingCopy = secureNowCollectionMissing ? secureNowEmptyState : null;
  const partialCapture = useLatestSnapshotCaptureIsPartial(isSecureNowProductLine(productLine));
  const partialCaptureSnapshotId = useLatestPartialCaptureSnapshotId(partialCapture);
  const partialCaptureReturnPath = useSecureNowPartialCaptureReturnPath();
  const showFindingsEmptyPartialCapture =
    isSecureNowProductLine(productLine)
    && partialCapture
    && !secureNowCollectionMissing
    && !props.loading
    && props.rows.length === 0
    && !props.loadFailed;

  const findingsEmptyPartialCaptureStrip = showFindingsEmptyPartialCapture ? (
    <SecureNowPartialCaptureRecoveryParagraph
      testId={
        props.isAssignedToMe
          ? "governance-assigned-findings-empty-partial-capture"
          : "governance-findings-empty-partial-capture"
      }
      partialCaptureSnapshotId={partialCaptureSnapshotId}
      returnPath={partialCaptureReturnPath}
      middleLine={SECURENOW_FINDINGS_EMPTY_PARTIAL_CAPTURE_LINE}
      cloudConnectionsTestId={
        props.isAssignedToMe
          ? "governance-assigned-findings-empty-partial-capture-cloud"
          : "governance-findings-empty-partial-capture-cloud"
      }
      extractUploadTestId={
        props.isAssignedToMe
          ? "governance-assigned-findings-empty-partial-capture-extract"
          : "governance-findings-empty-partial-capture-extract"
      }
    />
  ) : null;

  return (
    <>
      {!props.loading && props.rows.length === 0 && props.loadFailed && inhabitedEmptyState !== null && isLiveOperatorShellRecoveryContext() ? (
        <EnterpriseCompactEmptyState
          testId="inhabited-findings-live-recovery"
          title={INHABIT_FINDINGS_LIVE_RECOVERY_TITLE}
          description={INHABIT_FINDINGS_LIVE_RECOVERY_BODY}
          actions={resolveInhabitFindingsLiveRecoveryActions(props.scopedArchitectureId)}
          prominentBoundary
          role="alert"
          footer={
            <Button type="button" size="sm" variant="outline" onClick={() => props.onRefresh()}>
              Retry load
            </Button>
          }
        />
      ) : null}

      {!props.loading && props.rows.length === 0 && props.loadFailed && (inhabitedEmptyState === null || !isLiveOperatorShellRecoveryContext()) ? (
        <>
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
              props.loadFailure?.blockedReason ??
              (props.isAssignedToMe && props.buyerPolishedShell
                ? "Your assigned findings did not load. Existing assignments are unchanged — retry the load or check connectivity before navigating away."
                : !props.isAssignedToMe && props.buyerPolishedShell
                  ? "The findings queue did not load. Your existing findings are unchanged — retry the load or check connectivity before navigating away."
                  : props.loadFailedPreset.description)
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
              surfaceId: isSecureNowProductLine(productLine)
                ? "compliance-findings-queue-hard-failure"
                : "governance-findings-queue-hard-failure",
              errorTitle: props.pageTitle,
              errorCode: props.loadFailure?.errorCode ?? "governance-findings-load-failed",
              correlationId: props.loadFailure?.correlationId ?? null,
              httpStatus: props.loadFailure?.httpStatus ?? null,
            }}
          />
          <OperatorErrorRecoveryContract presentation={loadRecovery} />
        </>
      ) : null}

      {!props.loading && props.rows.length === 0 && !props.loadFailed ? (
        props.workspaceScopeTeaching !== null ? (
          <WorkspaceScopeEmptyTeaching
            title={props.workspaceScopeTeaching.title}
            body={props.workspaceScopeTeaching.body}
            ctaLabel={props.workspaceScopeTeaching.ctaLabel}
          />
        ) : (
          <div className="space-y-2">
          <EnterpriseCompactEmptyState
            testId="governance-findings-empty-state"
            title={
              props.isAssignedToMe
                ? assignedCollectionMissingCopy?.title ?? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT.title
                : inhabitedEmptyState !== null
                  ? inhabitedEmptyState.title
                  : secureNowEmptyState !== null
                    ? secureNowEmptyState.title
                  : props.buyerPolishedShell
                    ? BUYER_RISK_REGISTER_EMPTY_TITLE
                    : ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE
            }
            description={
              props.isAssignedToMe
                ? assignedCollectionMissingCopy?.description ?? buildGovernanceAssignedToMeEmptyDescription(
                    {
                      assigneeDisplayName: props.currentPrincipalName,
                      assigneeRoleLabel: props.currentPrincipalRole,
                      checkedAt: props.assignedToMeCheckedAt,
                      fetchBasis: props.assignedToMeFetchBasis,
                      productLine,
                      suppressCheckedAtLine: true,
                    },
                    { nowMs: relativeFreshnessNowMs, headerOwnsFreshness: true },
                  )
                : inhabitedEmptyState !== null
                  ? inhabitedEmptyState.description
                  : secureNowEmptyState !== null
                    ? secureNowEmptyState.description
                  : props.buyerPolishedShell
                    ? BUYER_RISK_REGISTER_EMPTY_BODY
                    : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
            }
            actions={
              props.isAssignedToMe
                ? undefined
                : secureNowEmptyState !== null
                  ? [
                      {
                        label: secureNowCollectionMissing ? "Open cloud connections" : "Open policy packs",
                        href: secureNowEmptyState.policyPacksHref,
                        variant: "primary",
                      },
                    ]
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
                <div className="space-y-3">
                  {findingsEmptyPartialCaptureStrip}
                  
                  {showFindingsEmptyPartialCapture && props.isAssignedToMe ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="governance-assigned-to-me-empty-partial-capture-not-load-failure"
                    >
                      {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE}
                    </p>
                  ) : null}
                  {secureNowCollectionMissing ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="governance-assigned-to-me-empty-collection-blocker-preface"
                    >
                      {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE}
                    </p>
                  ) : null}
                  {secureNowCollectionMissing ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="governance-assigned-to-me-empty-collection-blocker-not-load-failure"
                    >
                      {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE}
                    </p>
                  ) : null}
                  {secureNowCollectionMissing && collectionInput !== null ? (
                    <SecureNowCollectionPrimaryBlockerLine
                      input={collectionInput}
                      testIdPrefix="governance-assigned-findings-empty"
                    />
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href={assignedToMeFindingsHref(productLine)}>
                      {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL}
                    </Link>
                  </Button>
                  <PageCapabilityBoundaryStrip surfaceId="assignedFindings" className="mb-0" />
                  <GovernanceAssignedToMeBuildProvenanceStrip />
                </div>
              ) : secureNowEmptyState !== null ? (
                <div className="space-y-3">
                  {findingsEmptyPartialCaptureStrip}
                  
                  {showFindingsEmptyPartialCapture && !props.isAssignedToMe ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="governance-findings-empty-partial-capture-not-load-failure"
                    >
                      {GOVERNANCE_FINDINGS_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE}
                    </p>
                  ) : null}
                  {secureNowCollectionMissing ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    >
                      {GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE}
                    </p>
                  ) : null}
                  {secureNowCollectionMissing ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="governance-findings-empty-collection-blocker-not-load-failure"
                    >
                      {GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE}
                    </p>
                  ) : null}
                  {secureNowCollectionMissing && collectionInput !== null ? (
                    <SecureNowCollectionPrimaryBlockerLine
                      input={collectionInput}
                      testIdPrefix="governance-findings-empty"
                    />
                  ) : null}
                  <Link className={OPERATOR_LINK.inline} href={secureNowEmptyState.policyPacksHref}>
                    {secureNowCollectionMissing ? "Open cloud connections" : "View policy packs"}
                  </Link>
                </div>
              ) : !props.buyerPolishedShell ? (
                <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                  View policy packs
                </Link>
              ) : undefined
            }
          />
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="governance-findings-risk-register-empty-not-load-failure"
          >
            {RISK_REGISTER_EMPTY_NOT_LOAD_FAILURE_LINE}
          </p>
          </div>
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
