import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import {
  findingDetailHeadingTitle,
  findingDetailLeadSentence,
  findingInspectPageEyebrow,
} from "@/lib/finding-display-from-inspect";
import { formatFindingHumanReviewStatusLabel } from "@/lib/finding-human-review-display";
import { findingIdsAlignForInspectRoute } from "@/lib/load-finding-inspect-for-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/finding-policy-evidence-citations";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import { FindingInspectFindingBody } from "./FindingInspectFindingBody";
import { FindingInspectGovernanceStickinessPanel } from "./FindingInspectGovernanceStickinessPanel";
import { FindingInspectItsmWorkflowPanel } from "./FindingInspectItsmWorkflowPanel";

/** Compares authority run ids from URL vs API (hyphenated vs `N` GUID, case). */
export function sameAuthorityRunId(a: string, b: string): boolean
{
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
 * Sync inspector UI (payload / rule / evidence / audit). The RSC page loads data and passes props;
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
    return (
      <div className="w-full max-w-[1440px] space-y-4 p-6">
        <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Technical inspection</h1>
        <OperatorApiProblem
          problem={failure?.problem ?? null}
          fallbackMessage={failure?.message ?? "Finding inspector unavailable."}
          correlationId={failure?.correlationId ?? null}
        />
      </div>
    );
  }

  if (!sameAuthorityRunId(payload.runId, runId)) {
    return (
      <div className="w-full max-w-[1440px] space-y-4 p-6">
        <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolishedShell
            ? "This finding belongs to a different review package than the one in this URL."
            : (
                <>
                  This finding belongs to review{" "}
                  <span className="font-mono">{payload.runId}</span>{" "}
                  ({ARCHITECTURE_REVIEW_VOCABULARY.correlationIdFieldBridge}), not the review in this URL.
                </>
              )}
        </p>
        <Link
          href={`/reviews/${encodeURIComponent(payload.runId)}/findings/${encodeURIComponent(decodedFindingId)}/inspect`}
          className={OPERATOR_LINK.nav}
        >
          Open the correct inspector
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
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(payload.findingId)}/inspect`}
          className={OPERATOR_LINK.nav}
        >
          Open the inspector for finding {payload.findingId}
        </Link>
      </div>
    );
  }

  const findingTitle = findingDetailHeadingTitle(payload);
  const inspectHeroTitle = buyerPolishedShell ? "Evidence trace" : `${findingTitle} — evidence & trace`;
  const policyCitationModel = buildFindingPolicyEvidenceCitationsFromInspect(runId, decodedFindingId, payload);
  const policyTraceExcerpt = resolvePolicyTraceExcerptFromInspect(payload);

  return (
    <div className="w-full max-w-[1440px] space-y-4 p-4">
      {buyerPolishedShell ? (
        <div className={cn("flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.helper)}>
          <span className={cn("rounded-sm bg-neutral-200 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.badge)}>
            Appendix
          </span>
          <span>
            Supporting evidence trace — source evidence, trace path, and audit metadata linked to this finding within the
            review package.
          </span>
        </div>
      ) : null}

      <header
        className={
          buyerPolishedShell
            ? "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-3 border-2 p-5"
            : "space-y-3"
        }
      >
        <p className={cn("m-0 text-violet-900 dark:text-violet-200", OPERATOR_NAV_GROUP_LABEL)}>
          {findingInspectPageEyebrow(payload)}
        </p>
        <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{inspectHeroTitle}</h1>
        <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {findingDetailLeadSentence(payload)}
        </p>
        <ul className={cn("m-0 list-disc space-y-1.5 py-1 pl-5 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <li>
            <strong className="font-medium text-neutral-900 dark:text-neutral-100">Source evidence:</strong> citations,
            snapshots, and structured payload fields persisted with this finding.
          </li>
          <li>
            <strong className="font-medium text-neutral-900 dark:text-neutral-100">Trace path:</strong> decision rule →
            finding record → review record version; correlated events appear in the audit trail.
          </li>
          <li>
            <strong className="font-medium text-neutral-900 dark:text-neutral-100">Audit metadata:</strong> model and
            template versions (when present) support reproducibility — open the reference section below for full detail.
          </li>
        </ul>
        {!buyerPolishedShell ? (
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Finding <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{decodedFindingId}</span> — review record{" "}
            <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{payload.manifestVersion ?? "—"}</span>
          </p>
        ) : null}
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

      <OperatorEvidenceLimitsFooter
        runId={runId}
        findingIdForInspectLink={decodedFindingId}
        execution={runExecutionFootnote}
        inspectMetadata={{
          modelDeploymentName: payload.modelDeploymentName ?? null,
          promptTemplateVersion: payload.promptTemplateVersion ?? null,
        }}
      />
    </div>
  );
}
