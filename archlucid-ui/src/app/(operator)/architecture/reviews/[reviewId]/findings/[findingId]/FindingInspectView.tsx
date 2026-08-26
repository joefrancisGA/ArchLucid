import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/operator/OperatorEvidenceLimitsFooter";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/vocabulary/architecture-review-vocabulary";
import {
  findingDetailHeadingTitle,
  findingDetailLeadSentence,
  findingInspectPageEyebrow,
} from "@/lib/findings/finding-display-from-inspect";
import { formatFindingHumanReviewStatusLabel } from "@/lib/findings/finding-human-review-display";
import {
  EVIDENCE_TRACE_PAGE_SUBTITLE,
  getFindingDetailHref,
  getFindingEvidenceTraceHref,
} from "@/lib/findings/finding-evidence-navigation";
import {
  GOVERNANCE_ACTION_REGION_LEAD,
  GOVERNANCE_ACTION_REGION_TITLE,
} from "@/lib/findings/finding-governance-action-copy";
import { findingRecommendedActionParagraph } from "./_sections/finding-detail-route-display";
import { findingIdsAlignForInspectRoute } from "@/lib/load-finding-inspect-for-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/findings/finding-policy-evidence-citations";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { StatedConstraintContext } from "@/lib/review-quality/assumption-and-severity";
import { buildSeverityConstraintNoteForInspectPayload } from "@/lib/review-quality/finding-severity-constraint-note";
import { classifyInspectPayloadJobView } from "@/lib/findings/finding-inspect-job-view";
import {
  resolveFindingInspectCompleteFromPayload,
  resolveFindingInspectEmphasizedStepId,
  resolveFindingInspectSteps,
} from "@/lib/finding-inspect-checklist";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import { FindingEvidenceTraceBuyerChrome } from "./FindingEvidenceTraceBuyerChrome";
import { FindingEvidenceTraceBreadcrumb } from "./FindingEvidenceTraceBreadcrumb";
import { evidenceTracePageSubtitle } from "./evidence-trace-page-copy";

import { FindingSeverityConstraintNote } from "@/components/findings/FindingSeverityConstraintNote";
import { FindingJobViewLaneCallout } from "@/components/findings/FindingJobViewLaneCallout";
import { FindingInspectFindingBody } from "./FindingInspectFindingBody";
import { FindingInspectGovernanceStickinessPanel } from "./FindingInspectGovernanceStickinessPanel";
import { FindingInspectItsmWorkflowPanel } from "./FindingInspectItsmWorkflowPanel";
import { FindingInspectNextFindingEvidenceFooterClient } from "./_sections/FindingInspectNextFindingEvidenceFooterClient";
import { RunDetailNextReviewFooterClient } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailNextReviewFooterClient";

/** Compares authority run ids from URL vs API (hyphenated vs `N` GUID, case). */
export function sameAuthorityRunId(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/-/g, "").toLowerCase();

  return norm(String(a)) === norm(String(b));
}

export type FindingInspectViewProps = {
  runId: string;
  decodedFindingId: string;
  payload: FindingInspectPayload | null;
  failure: ApiLoadFailureState | null;
  runExecutionFootnote?: OperatorEvidenceLimitsExecutionProps | null;
  readonly approvedDecisionTitles?: readonly string[];
  readonly statedConstraintContext?: StatedConstraintContext | null;
};

/**
 * Evidence trace UI (payload / rule / evidence / audit). The RSC page loads data and passes props;
 * Vitest targets this module so mocks do not fight Next async server entrypoints.
 */
export function FindingInspectView({
  runId,
  decodedFindingId,
  payload,
  failure,
  runExecutionFootnote = null,
  approvedDecisionTitles = [],
  statedConstraintContext = null,
}: FindingInspectViewProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (failure || !payload) {
    if (buyerPolishedShell && failure) {
      return (
        <OperatorPageContainer variant="dashboard" className="space-y-4 p-6">
          <OperatorPageHeader
            navHref={GOVERNANCE_FINDINGS_PATH}
            title="Evidence trace"
            headingLevel="h1"
            actions={buyerPolishedShell ? undefined : <PageContextualHelpButton />}
          />
          <FindingOptionalArtifactUnavailable
            heading="Evidence trace temporarily unavailable"
            body="ArchLucid could not load the evidence trace for this finding right now."
            tryNext="Return to the finding summary or open the review findings list."
            buyerPolishedShell
            failure={failure}
          />
        </OperatorPageContainer>
      );
    }

    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4 p-6">
        <OperatorPageHeader navHref={GOVERNANCE_FINDINGS_PATH} title="Technical inspection" headingLevel="h1" />
        <FindingOptionalArtifactUnavailable
          heading="Evidence trace unavailable"
          body={failure?.message ?? "Finding inspector unavailable."}
          failure={failure}
        />
      </OperatorPageContainer>
    );
  }

  if (!sameAuthorityRunId(payload.runId, runId)) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4 p-6">
        <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolishedShell
            ? "This finding belongs to a different review than the one in this URL."
            : (
                <>
                  This finding belongs to review{" "}
                  <span className="font-mono">{payload.runId}</span>{" "}
                  ({ARCHITECTURE_REVIEW_VOCABULARY.correlationIdFieldBridge}), not the review in this URL.
                </>
              )}
        </p>
        <Link
          href={getFindingEvidenceTraceHref(payload.runId, decodedFindingId)}
          className={OPERATOR_LINK.nav}
        >
          Open the correct evidence trace
        </Link>
      </OperatorPageContainer>
    );
  }

  if (!findingIdsAlignForInspectRoute(decodedFindingId, payload.findingId)) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4 p-6">
        <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          This inspection payload corresponds to finding{" "}
          <span className="font-mono">{payload.findingId}</span>, not{" "}
          <span className="font-mono">{decodedFindingId}</span>.
        </p>
        <Link
          href={getFindingEvidenceTraceHref(runId, payload.findingId)}
          className={OPERATOR_LINK.nav}
        >
          Open the evidence trace for finding {payload.findingId}
        </Link>
      </OperatorPageContainer>
    );
  }

  const findingTitle = findingDetailHeadingTitle(payload);
  // TB-1826: finding-first H1 so buyers can name the finding from the first viewport.
  const inspectHeroTitle = findingTitle;
  const findingDetailHref = getFindingDetailHref(runId, decodedFindingId);
  const evidenceTraceSecondaryViewPresentation = buildCanonicalObjectSecondaryView(
    "finding",
    "findingEvidenceTrace",
    { runId, findingId: decodedFindingId },
  );
  const policyCitationModel = buildFindingPolicyEvidenceCitationsFromInspect(runId, decodedFindingId, payload);
  const policyTraceExcerpt = resolvePolicyTraceExcerptFromInspect(payload);
  const recommendedActionText =
    payload !== null ? findingRecommendedActionParagraph(payload, decodedFindingId) : "";
  const severityConstraintNote =
    payload !== null
      ? buildSeverityConstraintNoteForInspectPayload(payload, statedConstraintContext)
      : null;
  const findingJobView = payload !== null ? classifyInspectPayloadJobView(payload) : null;
  const scopedRunId = runId.trim();
  const findingInspectSteps = resolveFindingInspectSteps({
    reviewPicked: scopedRunId.length > 0,
    evidenceLoaded: payload !== null,
    inspectComplete: resolveFindingInspectCompleteFromPayload({
      evidenceCount: payload.evidence.length,
      decisionRuleId: payload.decisionRuleId,
      reasoningTrace: payload.reasoningTrace,
    }),
  });
  const findingInspectEmphasizedStepId = resolveFindingInspectEmphasizedStepId({
    reviewPicked: scopedRunId.length > 0,
    evidenceLoaded: payload !== null,
    inspectComplete: resolveFindingInspectCompleteFromPayload({
      evidenceCount: payload.evidence.length,
      decisionRuleId: payload.decisionRuleId,
      reasoningTrace: payload.reasoningTrace,
    }),
  });

  return (
    <OperatorPageContainer variant="dashboard" className={cn("p-4", OPERATOR_LAYOUT.sectionStack)} data-testid="finding-inspect-view">
      <CanonicalObjectSecondaryViewStrip
        presentation={evidenceTraceSecondaryViewPresentation}
        testId="evidence-trace-secondary-view-strip"
      />
      <IntegrationConnectChecklist
        title="Evidence trace checklist"
        steps={findingInspectSteps}
        emphasizedStepId={findingInspectEmphasizedStepId}
        testIdPrefix="finding-evidence-trace"
      />
      <section
        className="space-y-4"
        aria-label={inspectHeroTitle}
        data-testid="finding-evidence-trace-region"
      >
        <div
          className={
            buyerPolishedShell
              ? "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-3 border-2 p-5"
              : undefined
          }
        >
          <OperatorPageHeader
            navHref={GOVERNANCE_FINDINGS_PATH}
            title={inspectHeroTitle}
            headingLevel="h1"
            breadcrumb={
              buyerPolishedShell ? (
                <FindingEvidenceTraceBreadcrumb
                  findingDetailHref={findingDetailHref}
                  findingLabel={findingTitle}
                />
              ) : (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {findingInspectPageEyebrow(payload)}
                </p>
              )
            }
            subtitle={
              buyerPolishedShell ? (
                <p className="m-0">{evidenceTracePageSubtitle(buyerPolishedShell)}</p>
              ) : (
                <>
                  <p className="m-0">{EVIDENCE_TRACE_PAGE_SUBTITLE}</p>
                  <p className="m-0 mt-2">{findingDetailLeadSentence(payload)}</p>
                </>
              )
            }
            subtitleClassName="max-w-3xl leading-relaxed"
            actions={buyerPolishedShell ? undefined : <PageContextualHelpButton />}
          >
            {!buyerPolishedShell ? (
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Finding <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{decodedFindingId}</span> — review record{" "}
                <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{payload.manifestVersion ?? " — "}</span>
              </p>
            ) : null}
            <p className="m-0">
              <Link
                href={findingDetailHref}
                className={cn(OPERATOR_LINK.inline, "font-medium")}
                data-testid="evidence-trace-back-to-finding"
              >
                Back to finding
              </Link>
            </p>
          </OperatorPageHeader>
          <FindingEvidenceTraceBuyerChrome runId={runId} findingId={decodedFindingId} />
        </div>
{policyCitationModel.pack !== null || policyCitationModel.policy !== null ? (
          <FindingPolicyCitationHero model={policyCitationModel} traceExcerpt={policyTraceExcerpt} />
        ) : null}

        <FindingInspectFindingBody
          runId={runId}
          decodedFindingId={decodedFindingId}
          payload={payload}
          variant="inspect"
        />

        {severityConstraintNote !== null ? (
          <FindingSeverityConstraintNote note={severityConstraintNote} />
        ) : null}

        {findingJobView !== null ? (
          <FindingJobViewLaneCallout jobView={findingJobView} runId={runId} />
        ) : null}
      </section>

      <section
        className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/60 p-5 dark:border-neutral-800 dark:bg-neutral-900/30"
        aria-labelledby="governance-action-region-heading"
        data-testid="finding-governance-action-region"
      >
        <div className="space-y-1">
          <h2
            id="governance-action-region-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            {GOVERNANCE_ACTION_REGION_TITLE}
          </h2>
          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {GOVERNANCE_ACTION_REGION_LEAD}
          </p>
        </div>

        <FindingInspectGovernanceStickinessPanel
          findingId={decodedFindingId}
          runId={runId}
          initialAssignedToUserId={payload.assignedToUserId}
          initialRemediationDueUtc={payload.remediationDueUtc}
          recommendation={recommendedActionText}
          recommendedActions={payload.recommendedActions}
          approvedDecisionTitles={approvedDecisionTitles}
        />

        <FindingInspectItsmWorkflowPanel
          findingId={decodedFindingId}
          humanReviewStatusLabel={formatFindingHumanReviewStatusLabel(payload.humanReviewStatus)}
        />
      </section>

      <OperatorEvidenceLimitsFooter
        runId={runId}
        execution={runExecutionFootnote}
        inspectMetadata={{
          modelDeploymentName: payload.modelDeploymentName ?? null,
          modelAlias: payload.modelAlias ?? null,
          promptTemplateVersion: payload.promptTemplateVersion ?? null,
        }}
      />

      <FindingInspectNextFindingEvidenceFooterClient runId={runId} findingId={decodedFindingId} />
      <RunDetailNextReviewFooterClient runId={runId} />
    </OperatorPageContainer>
  );
}
