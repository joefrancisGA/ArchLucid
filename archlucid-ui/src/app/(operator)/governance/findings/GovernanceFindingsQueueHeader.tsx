"use client";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { GovernanceFindingsAssignedToMeBreadcrumb } from "@/components/governance/findings/GovernanceFindingsAssignedToMeBreadcrumb";
import { GovernanceFindingsQueueBreadcrumb } from "@/components/governance/findings/GovernanceFindingsQueueBreadcrumb";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { FindingsKeyboardTriageCoach } from "@/components/usability/FindingsKeyboardTriageCoach";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import {
  GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID,
  GOVERNANCE_FINDINGS_SKIP_LINK_LABEL,
} from "@/lib/governance-findings-page-copy";
import type { GovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { governanceRegisterMetricPresentation } from "@/lib/metric-count-presentation";
import { GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE } from "@/lib/governance/governance-findings-evidence-copy";

export type GovernanceFindingsQueueHeaderProps = {
  readonly isAssignedToMe: boolean;
  readonly buyerPolishedShell: boolean;
  readonly showGovernanceApprovalBanner: boolean;
  readonly governanceApprovalProvenance: GovernanceApprovalProvenance | null;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly navHref: string;
  readonly assignedToMeStatusBadge: React.ReactNode;
  readonly assignedToMeHeaderMetadata: React.ReactNode | undefined;
  readonly assignedToMeHeaderActions: React.ReactNode;
  readonly registerSummary: {
    readonly openRisks: number;
    readonly expiringExceptions: number;
    readonly pendingOwner: number;
    readonly overdueReview: number;
  };
  readonly scopedRunId: string | null;
  readonly loading: boolean;
  readonly currentJobId: GovernanceJobId;
};

export function GovernanceFindingsQueueHeader({
  isAssignedToMe,
  buyerPolishedShell,
  showGovernanceApprovalBanner,
  governanceApprovalProvenance,
  pageTitle,
  pageSubtitle,
  navHref,
  assignedToMeStatusBadge,
  assignedToMeHeaderMetadata,
  assignedToMeHeaderActions,
  registerSummary,
  scopedRunId,
  loading,
  currentJobId,
}: GovernanceFindingsQueueHeaderProps) {
  return (
    <>
      {!isAssignedToMe ? (
        <a
          href={`#${GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_FINDINGS_SKIP_LINK_LABEL}
        </a>
      ) : null}

      {showGovernanceApprovalBanner ? (
        <GovernanceApprovalStatusBanner
          className="mb-4"
          onRiskRegisterPage={!isAssignedToMe}
          onAssignedToMeFindingsPage={isAssignedToMe}
          provenance={governanceApprovalProvenance}
        />
      ) : !isAssignedToMe && !buyerPolishedShell ? (
        <LayerHeader pageKey="governance-findings" density="compact" />
      ) : null}

      {!isAssignedToMe ? <FindingsKeyboardTriageCoach /> : null}

      <OperatorPageHeader
        navHref={navHref}
        title={pageTitle}
        subtitle={pageSubtitle}
        claimDiscipline={GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="governance-findings-claim-discipline"
        titleTestId="architecture-risk-register-page-title"
        breadcrumb={
          isAssignedToMe ? (
            <GovernanceFindingsAssignedToMeBreadcrumb />
          ) : buyerPolishedShell ? (
            <GovernanceFindingsQueueBreadcrumb />
          ) : undefined
        }
        statusBadge={assignedToMeStatusBadge}
        metadata={
          isAssignedToMe ? (
            assignedToMeHeaderMetadata
          ) : !buyerPolishedShell && !loading ? (
            <>
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-open"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.openRisks,
                  noun: registerSummary.openRisks === 1 ? "open finding" : "open findings",
                  filter: "open",
                  runId: scopedRunId,
                })}
              />
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-expiring"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.expiringExceptions,
                  noun:
                    registerSummary.expiringExceptions === 1 ? "expiring exception" : "expiring exceptions",
                  filter: "expiring-soon",
                  runId: scopedRunId,
                })}
              />
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-owner"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.pendingOwner,
                  noun: registerSummary.pendingOwner === 1 ? "pending owner" : "pending owners",
                  filter: "no-owner",
                  runId: scopedRunId,
                })}
              />
              <SelfDescribingMetricCount
                variant="inline"
                testId="architecture-risk-register-summary-overdue"
                presentation={governanceRegisterMetricPresentation({
                  count: registerSummary.overdueReview,
                  noun: registerSummary.overdueReview === 1 ? "overdue review" : "overdue reviews",
                  filter: "overdue-review",
                  runId: scopedRunId,
                })}
              />
            </>
          ) : undefined
        }
        actions={assignedToMeHeaderActions}
      />
      {!isAssignedToMe ? <GovernanceJobRouterStrip currentJobId={currentJobId} layout="default" /> : null}
      {!isAssignedToMe && !buyerPolishedShell ? (
        <>
          <AlertsFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <DecisionRegisterFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <RiskExceptionsFindingsVocabularyRail currentSurfaceId="findings-queue" />
          <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="findings-queue" />
          <PageCapabilityBoundaryStrip surfaceId="governanceFindings" />
        </>
      ) : null}
    </>
  );
}
