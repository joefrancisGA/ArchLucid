import Link from "next/link";

import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingIacStubPanel } from "@/components/FindingIacStubPanel";
import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorEvidenceLimitsFooter } from "@/components/OperatorEvidenceLimitsFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  findingDetailLeadSentence,
  findingDetailPageEyebrow,
  findingInspectPrimaryLabels,
  phiMinimizationBuyerConsequenceNarrative,
} from "@/lib/finding-display-from-inspect";
import { findingSeverityAudienceCopy } from "@/lib/finding-explainability-summary";
import { BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION } from "@/lib/buyer-polish-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { graphEvidenceHrefFromInspect } from "@/lib/finding-inspect-graph-evidence";
import { cn } from "@/lib/utils";

import { FindingInspectFindingBody } from "../FindingInspectFindingBody";
import {
  fallbackImpactedScope,
  fallbackSeverity,
  fallbackStatus,
  findingDetailLeadFallback,
  mitigationPosture,
  summarizeEvidenceBasis,
  validationRequirement,
} from "./finding-detail-route-display";
import type { FindingDetailPageModel } from "./finding-detail-page-model";

type Props = {
  readonly model: FindingDetailPageModel;
};

/** Finding detail layout: buyer-polished hero vs operator header, body, export, footer. */
export function FindingDetailPageView(props: Props) {
  const model = props.model;
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    inspectFailure,
    buyerPolishedShell,
    linkedManifestHref,
    pageTitle,
    findingIsPhi,
    runExecutionFootnote,
  } = model;

  const labels = inspectPayload !== null ? findingInspectPrimaryLabels(inspectPayload) : null;

  const graphEvidenceHref =
    inspectPayload !== null
      ? graphEvidenceHrefFromInspect(runId, decodedFindingId, inspectPayload)
      : null;

  const severityHeadline = fallbackSeverity(inspectPayload, decodedFindingId);
  const severityRationale =
    severityHeadline.trim().length > 0 ? findingSeverityAudienceCopy(severityHeadline).meaningForOperators : "";

  const confidenceLevel = inspectPayload?.confidenceLevel ?? null;
  const evaluationScore = inspectPayload?.evaluationConfidenceScore ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/reviews/${encodeURIComponent(runId)}`}
          className="font-medium text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-neutral-600 dark:hover:text-teal-200"
        >
          ← Back to review package
        </Link>
        <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
          ·
        </span>
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(decodedFindingId)}/inspect`}
          className="text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-neutral-600 dark:hover:text-teal-200"
        >
          {buyerPolishedShell ? "Open technical evidence trace" : "Technical inspection trail"}
        </Link>
      </nav>

      {buyerPolishedShell ? (
        <section className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm dark:border-teal-900 dark:bg-neutral-950">
          <div className="border-b border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-6 dark:border-teal-950 dark:from-teal-950/50 dark:via-neutral-950 dark:to-amber-950/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl space-y-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800 dark:text-teal-200">
                  {findingDetailPageEyebrow(inspectPayload, decodedFindingId)}
                </p>
                <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>
                  {pageTitle}
                </h1>
                <p className="m-0 max-w-2xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {inspectPayload !== null
                    ? findingDetailLeadSentence(inspectPayload)
                    : findingDetailLeadFallback(decodedFindingId)}
                </p>
              </div>

              <div className="rounded-xl border border-white/70 bg-white/90 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80">
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Related decision
                </p>
                {linkedManifestHref !== null ? (
                  <Link
                    className="mt-1 inline-flex text-sm font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                    href={linkedManifestHref}
                  >
                    Open manifest decision
                  </Link>
                ) : (
                  <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">Manifest link unavailable</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Severity</p>
                <p className="m-0 mt-1 text-sm font-semibold text-neutral-950 dark:text-neutral-100">{severityHeadline}</p>
                {severityRationale.length > 0 ? (
                  <p className="m-0 mt-2 text-xs leading-snug text-neutral-600 dark:text-neutral-400">{severityRationale}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Status</p>
                <p className="m-0 mt-1 text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                  {fallbackStatus(inspectPayload, decodedFindingId)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Evidence basis</p>
                <p className="m-0 mt-1 text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                  {summarizeEvidenceBasis(inspectPayload)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Impacted scope</p>
                <p className="m-0 mt-1 text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                  {fallbackImpactedScope(inspectPayload, decodedFindingId)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-t border-teal-100/80 pt-4 dark:border-teal-950/60">
              <div className="min-w-[12rem] flex-1 space-y-2">
                <p className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Finding evaluation confidence
                </p>
                {confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low" ? (
                  <>
                    <FindingConfidenceBadge level={confidenceLevel} />
                    <p className="m-0 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                      {BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION}
                    </p>
                  </>
                ) : buyerPolishedShell ? (
                  <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                    Medium confidence — based on policy rule match and cited intake subgraph evidence.
                  </p>
                ) : (
                  <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                    Confidence assessment not available for this finding.
                  </p>
                )}
                {evaluationScore !== null && Number.isFinite(evaluationScore) && !buyerPolishedShell ? (
                  <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                    Numerical score: {evaluationScore.toFixed(2)} (evaluation payload)
                  </p>
                ) : null}
              </div>
              {graphEvidenceHref !== null ? (
                <Button type="button" asChild variant="default" size="sm" className="shrink-0">
                  <Link href={graphEvidenceHref}>{BUYER_SURFACE_VOCABULARY.evidenceGraphNav}</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className={cn("p-4", operatorSemanticSurface("warn"))}>
              <h2 className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Business impact</h2>
              <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {findingIsPhi
                  ? "If PHI slips outside minimization boundaries at intake, breach notification scope, audit findings, and downstream processing obligations expand. Documented ingress classification and weekly exception monitoring keep this risk within accepted limits."
                  : "This finding is recorded in the finalized governance package with evidence trail linkage."}
              </p>
            </div>
            <div className={cn("p-4", DESIGN_TOKENS.surface.card)}>
              <h2 className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Required monitoring</h2>
              <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                {mitigationPosture(inspectPayload, decodedFindingId)}
              </p>
            </div>
            <div className={cn("p-4", operatorSemanticSurface("info"))}>
              <h2 className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Decision</h2>
              <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                Accepted with monitoring — non-blocking for approval. See acceptance record below for recorded controls.
              </p>
            </div>
          </div>

          <CollapsibleSection title="Acceptance record" defaultOpen={buyerPolishedShell}>
            <p className="m-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {validationRequirement(inspectPayload, decodedFindingId)}
            </p>
          </CollapsibleSection>

          {findingIsPhi ? (
            <div className="border-t border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Focused finding narrative
              </p>
              <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {phiMinimizationBuyerConsequenceNarrative()}
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <header className="space-y-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Finding detail
          </p>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{pageTitle}</h1>

          {labels !== null ? (
            <div className="flex flex-wrap items-center gap-2">
              {labels.severityLabel ? (
                <Badge variant="secondary" className="font-normal">
                  {labels.severityLabel}
                </Badge>
              ) : null}
              {labels.categoryLabel ? (
                <Badge variant="outline" className="font-normal">
                  {labels.categoryLabel}
                </Badge>
              ) : null}
              {labels.statusLabel ? (
                <Badge variant="outline" className="font-normal">
                  {labels.statusLabel}
                </Badge>
              ) : null}
              {labels.impactedAreaLabel ? (
                <Badge variant="outline" className="max-w-full whitespace-normal text-left font-normal">
                  Business impact: {labels.impactedAreaLabel}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null &&
          (confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low") ? (
            <div className="flex flex-wrap items-center gap-2">
              <FindingConfidenceBadge level={confidenceLevel} />
              {evaluationScore !== null && Number.isFinite(evaluationScore) ? (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Score {evaluationScore.toFixed(2)}
                </span>
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null && severityRationale.length > 0 ? (
            <p className="m-0 max-w-prose text-xs text-neutral-600 dark:text-neutral-400">{severityRationale}</p>
          ) : null}

          {graphEvidenceHref !== null ? (
            <p className="m-0">
              <Link
                className="text-sm font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-100"
                href={graphEvidenceHref}
              >
                View evidence trail
              </Link>
            </p>
          ) : null}

          {inspectPayload !== null ? (
            <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {findingDetailLeadSentence(inspectPayload)}
            </p>
          ) : null}
        </header>
      )}

      {inspectFailure !== null ? (
        <OperatorApiProblem
          problem={inspectFailure.problem}
          fallbackMessage={inspectFailure.message}
          correlationId={inspectFailure.correlationId}
        />
      ) : null}

      {inspectPayload !== null ? (
        <FindingInspectFindingBody
          runId={runId}
          decodedFindingId={decodedFindingId}
          payload={inspectPayload}
          variant="detail"
        />
      ) : null}

      {inspectPayload !== null ? (
        <FindingAskInlinePanel findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingIacStubPanel runId={runId} findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Export for work tracking" defaultOpen={false}>
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Copy a structured summary formatted for your issue tracker (Markdown, GitHub Issues, Azure Boards, or Jira).
          </p>
          <div className="pt-3">
            <CopyFindingAsWorkItemButton findingId={decodedFindingId} payload={inspectPayload} runId={runId} />
          </div>
        </CollapsibleSection>
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Technical identifiers" defaultOpen={false}>
          <dl className="m-0 grid gap-2 text-sm text-neutral-800 dark:text-neutral-200">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Finding id
              </dt>
              <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
                  {decodedFindingId}
                </code>
                <CopyIdButton value={decodedFindingId} aria-label="Copy finding ID" />
              </dd>
            </div>
            {inspectPayload.manifestVersion ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Manifest version
                </dt>
                <dd className="m-0 mt-1 font-mono text-xs">{inspectPayload.manifestVersion}</dd>
              </div>
            ) : null}
          </dl>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        title={buyerPolishedShell ? "Related audit record" : "Technical audit trail"}
        defaultOpen={false}
      >
        <FindingExplainPanel
          runId={runId}
          findingId={findingIdRouteParam}
          confidenceLevel={inspectPayload?.confidenceLevel ?? null}
        />
      </CollapsibleSection>

      <OperatorEvidenceLimitsFooter
        runId={runId}
        findingIdForInspectLink={decodedFindingId}
        execution={runExecutionFootnote}
        inspectMetadata={
          inspectPayload !== null
            ? {
                modelDeploymentName: inspectPayload.modelDeploymentName ?? null,
                promptTemplateVersion: inspectPayload.promptTemplateVersion ?? null,
              }
            : null
        }
      />
    </div>
  );
}
