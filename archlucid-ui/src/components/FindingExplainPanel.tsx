"use client";

import { BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";
import { MutationErrorBoundary } from "@/components/MutationErrorBoundary";
import { DocumentLayout } from "@/components/DocumentLayout";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getFindingEvidenceChain, getFindingLlmAudit, postFindingFeedback } from "@/lib/api";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { BUYER_EVIDENCE_CHAIN_SOURCE_LINE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { resolveFindingOptionalArtifactUnavailableCopy } from "@/lib/findings/finding-optional-artifact-copy";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingConfidenceLevel, FindingEvidenceChain, FindingLlmAudit } from "@/types/explanation";

export type FindingExplainPanelProps = {
  runId: string;
  findingId: string;
  /** Evaluation coarse bucket when supplied by inspect/explainability callers; omit when unknown. */
  confidenceLevel?: FindingConfidenceLevel | null;
  buyerPolishedShell?: boolean;
  graphEvidenceHref?: string | null;
  linkedManifestHref?: string | null;
};

/**
 * Redacted LLM prompt/completion audit for one finding, plus thumbs feedback (Execute). Deterministic trace lives in
 * `FindingExplainabilityDialog` / `GET …/explainability`.
 */
export function FindingExplainPanel({
  runId,
  findingId,
  confidenceLevel,
  buyerPolishedShell: buyerPolishedShellProp,
  graphEvidenceHref,
  linkedManifestHref,
}: FindingExplainPanelProps) {
  const rank = useNavCallerAuthorityRank();
  const buyerPolishedShell = buyerPolishedShellProp === true || isBuyerPolishedOperatorShellEnv();
  const sampleReview = isShowcaseStaticDemoRunId(runId.trim());
  const [audit, setAudit] = useState<FindingLlmAudit | null>(null);
  const [evidenceChain, setEvidenceChain] = useState<FindingEvidenceChain | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (findingId.trim().length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);
    setFeedbackNote(null);
    setEvidenceChain(null);

    try {
      const a = await getFindingLlmAudit(runId, findingId.trim());
      setAudit(a);
      recordFirstTenantFunnelEvent("first_finding_viewed");

      try {
        const chain = await getFindingEvidenceChain(runId, findingId.trim());
        setEvidenceChain(chain);
      } catch {
        setEvidenceChain(null);
      }
    } catch (err) {
      setFailure(toApiLoadFailure(err));
    } finally {
      setLoading(false);
    }
  }, [findingId, runId]);

  useEffect(() => {
    if (rank < AUTHORITY_RANK.ReadAuthority) {
      return;
    }

    void load();
  }, [load, rank]);

  if (rank < AUTHORITY_RANK.ReadAuthority) {
    return (
      <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Sign in with Read access or higher to view redacted LLM audit text for this finding.
      </p>
    );
  }

  const canVote = rank >= AUTHORITY_RANK.ExecuteAuthority;

  return (
    <MutationErrorBoundary title="Finding explain panel failed to render">
    <div className="space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      <h4 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Explain this finding</h4>
      {(confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low") ? (
        <div className="mt-1">
          <FindingConfidenceBadge level={confidenceLevel} />
        </div>
      ) : null}
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Redacted prompts and model output are under <strong className="font-medium">Technical audit details</strong> below.
        Pair with deterministic explainability (&quot;View trace&quot;) on the review explanation table when available.
      </p>

      {!loading && failure === null && evidenceChain !== null ? (
        <section aria-labelledby="finding-evidence-chain-heading" className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-2 p-3">
          <h4
            id="finding-evidence-chain-heading"
            className={cn("m-0 font-semibold text-violet-900 dark:text-violet-100", OPERATOR_NAV_GROUP_LABEL)}
          >
            Evidence chain (persisted pointers)
          </h4>
          <p className={cn("m-0 text-violet-900/90 dark:text-violet-100/90", OPERATOR_TYPOGRAPHY.helper)}>
            {buyerPolishedShell ? (
              BUYER_EVIDENCE_CHAIN_SOURCE_LINE
            ) : (
              <>
                From{" "}
                <code className="rounded bg-violet-200/80 px-1 text-[0.65rem] dark:bg-violet-900/80">
                  GET /v1/architecture/review/…/findings/…/evidence-chain
                </code>
                .
              </>
            )}
          </p>
          <dl className={cn("m-0 grid gap-2 text-violet-950 dark:text-violet-50 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
            <div>
              <dt className="font-semibold">Review record version</dt>
              <dd className="m-0 font-mono">{evidenceChain.manifestVersion?.trim() ? evidenceChain.manifestVersion : "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Findings snapshot</dt>
              <dd className="m-0 font-mono">{evidenceChain.findingsSnapshotId ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Decision trace</dt>
              <dd className="m-0 font-mono">{evidenceChain.decisionTraceId ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Review record id</dt>
              <dd className="m-0 font-mono">{evidenceChain.goldenManifestId ?? "—"}</dd>
            </div>
          </dl>
          {evidenceChain.relatedGraphNodeIds.length > 0 ? (
            <div>
              <p className={cn("m-0 mb-1 font-semibold text-violet-900 dark:text-violet-100", OPERATOR_TYPOGRAPHY.helper)}>Related graph nodes</p>
              <ul className="m-0 list-disc space-y-0.5 pl-5 font-mono text-[0.7rem]">
                {evidenceChain.relatedGraphNodeIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {evidenceChain.agentExecutionTraceIds.length > 0 ? (
            <div>
              <p className={cn("m-0 mb-1 font-semibold text-violet-900 dark:text-violet-100", OPERATOR_TYPOGRAPHY.helper)}>Agent execution traces</p>
              <ul className="m-0 list-disc space-y-0.5 pl-5 font-mono text-[0.7rem]">
                {evidenceChain.agentExecutionTraceIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {loading ? (
        <OperatorLoadingNotice>
          <strong>Loading LLM audit…</strong>
        </OperatorLoadingNotice>
      ) : null}

      {failure !== null ? (
        <FindingOptionalArtifactUnavailable
          {...resolveFindingOptionalArtifactUnavailableCopy("audit-record", failure, {
            buyerPolishedShell,
            sampleReview,
          })}
          onRetry={() => {
            void load();
          }}
          loading={loading}
          recoveryLinks={[
            ...(graphEvidenceHref !== null && graphEvidenceHref !== undefined
              ? [{ href: graphEvidenceHref, label: "Open evidence graph" }]
              : []),
            ...(linkedManifestHref !== null && linkedManifestHref !== undefined
              ? [{ href: linkedManifestHref, label: BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA }]
              : []),
          ]}
          failure={failure}
          buyerPolishedShell={buyerPolishedShell}
        />
      ) : null}

      {!loading && failure === null && audit !== null ? (
        <Collapsible defaultOpen={false} className="rounded-md border border-neutral-200 dark:border-neutral-600">
          <CollapsibleTrigger
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left font-semibold text-neutral-900 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
            aria-label="Expand technical audit details (redacted prompts and completion)"
          >
            <span>Technical audit details (redacted)</span>
            <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Show</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-neutral-200 px-3 pb-3 pt-2 dark:border-neutral-600">
            <DocumentLayout
              tocItems={[
                { id: "finding-audit-system", label: "System prompt" },
                { id: "finding-audit-user", label: "User prompt" },
                { id: "finding-audit-completion", label: "Completion" },
              ]}
            >
              <div className="space-y-2">
                <p
                  id="finding-audit-system"
                  className={cn("m-0 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}
                >
                  System prompt (redacted) Â· trace {audit.traceId}
                </p>
                <pre className={cn("max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.micro)}>
                  {audit.systemPromptRedacted.trim().length > 0 ? audit.systemPromptRedacted : "(empty)"}
                </pre>
                <p
                  id="finding-audit-user"
                  className={cn("m-0 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}
                >
                  User prompt (redacted)
                </p>
                <pre className={cn("max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.micro)}>
                  {audit.userPromptRedacted.trim().length > 0 ? audit.userPromptRedacted : "(empty)"}
                </pre>
                <p
                  id="finding-audit-completion"
                  className={cn("m-0 font-semibold text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}
                >
                  LLM completion (redacted)
                </p>
                <pre className={cn("max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-2 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.micro)}>
                  {audit.rawResponseRedacted.trim().length > 0 ? audit.rawResponseRedacted : "(empty)"}
                </pre>
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Model: {audit.modelDeploymentName ?? "—"} · Agent: {buyerLabelForAgentType(audit.agentType)}
                </p>
              </div>
            </DocumentLayout>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {canVote ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Was this finding helpful?</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={feedbackBusy}
            onClick={() => {
              void (async () => {
                setFeedbackBusy(true);
                setFeedbackNote(null);

                try {
                  await postFindingFeedback(runId, findingId.trim(), 1);
                  setFeedbackNote("Thanks — feedback recorded.");
                } catch {
                  setFeedbackNote(
                    buyerPolishedShell
                      ? "Feedback could not be saved right now. Try again in a moment."
                      : "Feedback could not be saved.",
                  );
                } finally {
                  setFeedbackBusy(false);
                }
              })();
            }}
          >
            Thumbs up
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={feedbackBusy}
            onClick={() => {
              void (async () => {
                setFeedbackBusy(true);
                setFeedbackNote(null);

                try {
                  await postFindingFeedback(runId, findingId.trim(), -1);
                  setFeedbackNote("Thanks — feedback recorded.");
                } catch {
                  setFeedbackNote(
                    buyerPolishedShell
                      ? "Feedback could not be saved right now. Try again in a moment."
                      : "Feedback could not be saved.",
                  );
                } finally {
                  setFeedbackBusy(false);
                }
              })();
            }}
          >
            Thumbs down
          </Button>
          {feedbackNote !== null ? <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{feedbackNote}</span> : null}
        </div>
      ) : (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Thumbs feedback requires Architect access or higher (API-enforced).
        </p>
      )}
    </div>
    </MutationErrorBoundary>
  );
}
