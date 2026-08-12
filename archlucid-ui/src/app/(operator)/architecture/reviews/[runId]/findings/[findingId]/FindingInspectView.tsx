import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/operator/OperatorEvidenceLimitsFooter";
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
import { findingIdsAlignForInspectRoute } from "@/lib/load-finding-inspect-for-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/findings/finding-policy-evidence-citations";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import { FindingInspectFindingBody } from "./FindingInspectFindingBody";
import { FindingInspectGovernanceStickinessPanel } from "./FindingInspectGovernanceStickinessPanel";
import { FindingInspectItsmWorkflowPanel } from "./FindingInspectItsmWorkflowPanel";

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
}: FindingInspectViewProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (failure || !payload) {
    if (buyerPolishedShell && failure) {
      return (
        <div className="w-full max-w-[1440px] space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Evidence trace</h1>
            <PageContextualHelpButton />
          </div>
          <FindingOptionalArtifactUnavailable
            heading="Evidence trace temporarily unavailable"
            body="ArchLucid could not load the evidence trace for this finding right now."
            tryNext="Return to the finding summary or open the review findings list."
            buyerPolishedShell
            failure={failure}
          />
        </div>
      );
    }

    return (
      <div className="w-full max-w-[1440px] space-y-4 p-6">
        <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Technical inspection</h1>
        <FindingOptionalArtifactUnavailable
          heading="Evidence trace unavailable"
          body={failure?.message ?? "Finding inspector unavailable."}
          failure={failure}
        />
      </div>
    );
  }

  if (!sameAuthorityRunId(payload.runId, runId)) {
    return (
      <div className="w-full max-w-[1440px] space-y-4 p-6">
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
      </div>
    );
  }

  if (!findingIdsAlignForInspectRoute(decodedFindingId, payload.findingId)) {
    return (
      <div className="w-full max-w-[1440px] space-y-4 p-6">
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
      </div>
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

  return (
    <div className="w-full max-w-[1440px] space-y-6 p-4" data-testid="finding-inspect-view">
      <CanonicalObjectSecondaryViewStrip
        presentation={evidenceTraceSecondaryViewPresentation}
        testId="evidence-trace-secondary-view-strip"
      />
      <section
        className="space-y-4"
        aria-labelledby="evidence-trace-region-heading"
        data-testid="finding-evidence-trace-region"
      >
        <header
          className={
            buyerPolishedShell
              ? "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-3 border-2 p-5"
              : "space-y-3"
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {findingInspectPageEyebrow(payload)}
            </p>
            <PageContextualHelpButton />
          </div>
          <h1 id="evidence-trace-region-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
            {inspectHeroTitle}
          </h1>
          <p className={cn("m-0 max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {EVIDENCE_TRACE_PAGE_SUBTITLE}
          </p>
          <p className={cn("m-0 max-w-3xl leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {findingDetailLeadSentence(payload)}
          </p>
          {!buyerPolishedShell ? (
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Finding <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{decodedFindingId}</span> — review record{" "}
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{payload.manifestVersion ?? "—"}</span>
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
        </header>
{policyCitationModel.pack !== null || policyCitationModel.policy !== null ? (
          <FindingPolicyCitationHero model={policyCitationModel} traceExcerpt={policyTraceExcerpt} />
        ) : null}

        <FindingInspectFindingBody
          runId={runId}
          decodedFindingId={decodedFindingId}
          payload={payload}
          variant="inspect"
        />
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
    </div>
  );
}
