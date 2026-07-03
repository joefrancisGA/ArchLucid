import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingInspectContextDebugPanel } from "@/components/findings/FindingInspectContextDebugPanel";
import { FindingProvenancePanel } from "@/components/findings/FindingProvenancePanel";
import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingIacStubPanel } from "@/components/FindingIacStubPanel";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { FindingItsmExportPanel } from "@/components/FindingItsmExportPanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { FindingExplainabilityTracePanel } from "@/components/FindingExplainabilityTracePanel";
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
import { BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION, BUYER_FINDING_SUMMARY_DECISION_IMPACT_LABEL, BUYER_FINDING_SUMMARY_NEXT_STEP_LABEL } from "@/lib/buyer-polish-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { DESIGN_TOKENS, OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { graphEvidenceHrefFromInspect } from "@/lib/finding-inspect-graph-evidence";
import {
  buildFindingPolicyEvidenceCitationsFromInspect,
  resolvePolicyTraceExcerptFromInspect,
} from "@/lib/finding-policy-evidence-citations";

import { FindingInspectFindingBody } from "../FindingInspectFindingBody";
import { FindingInspectItsmWorkflowPanel } from "../FindingInspectItsmWorkflowPanel";
import {
  fallbackSeverity,
  findingDetailLeadFallback,
  buyerFindingDecisionPanelCopy,
  buyerFindingDecisionImpactCopy,
  buyerFindingNextStepCopy,
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
  const policyProvenanceModel =
    inspectPayload !== null
      ? buildFindingPolicyEvidenceCitationsFromInspect(runId, decodedFindingId, inspectPayload)
      : null;
  const policyTraceExcerpt =
    inspectPayload !== null ? resolvePolicyTraceExcerptFromInspect(inspectPayload) : null;

  return (
    <div className="w-full max-w-[1440px] space-y-4 p-4">
      <nav className={cn("flex flex-wrap items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(decodedFindingId)}/inspect`}
          className={OPERATOR_LINK.nav}
        >
          {buyerPolishedShell ? "Open evidence trace" : "Technical inspection trail"}
        </Link>
      </nav>

      {buyerPolishedShell ? (
        <section className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm dark:border-teal-900 dark:bg-neutral-950">
          <div className="border-b border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-6 dark:border-teal-950 dark:from-teal-950/50 dark:via-neutral-950 dark:to-amber-950/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl space-y-3">
                <p className={cn("m-0 text-teal-800 dark:text-teal-200", OPERATOR_NAV_GROUP_LABEL)}>
                  {findingDetailPageEyebrow(inspectPayload, decodedFindingId)}
                </p>
                <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>
                  {pageTitle}
                </h1>
                {policyProvenanceModel !== null &&
                (policyProvenanceModel.pack !== null || policyProvenanceModel.policy !== null) ? (
                  <FindingPolicyCitationHero
                    model={policyProvenanceModel}
                    traceExcerpt={policyTraceExcerpt}
                  />
                ) : null}
                <p className={cn("m-0 max-w-2xl leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {inspectPayload !== null
                    ? findingDetailLeadSentence(inspectPayload)
                    : findingDetailLeadFallback(decodedFindingId)}
                </p>
              </div>

              <div className="rounded-xl border border-white/70 bg-white/90 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80">
                <p className={cn("m-0", OPERATOR_KPI_CARD_TITLE)}>
                  Related decision
                </p>
                {linkedManifestHref !== null ? (
                  <Link
                    className={cn("mt-1 inline-flex font-semibold", OPERATOR_LINK.nav)}
                    href={linkedManifestHref}
                  >
                    Open signed decision record
                  </Link>
                ) : (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Signed review record link unavailable</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className={cn("m-0", OPERATOR_KPI_CARD_TITLE)}>Severity</p>
                <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{severityHeadline}</p>
                {severityRationale.length > 0 ? (
                  <p className={cn("m-0 mt-2 leading-snug text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>{severityRationale}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className={cn("m-0", OPERATOR_KPI_CARD_TITLE)}>
                  {BUYER_FINDING_SUMMARY_DECISION_IMPACT_LABEL}
                </p>
                <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {buyerFindingDecisionImpactCopy(inspectPayload, decodedFindingId)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className={cn("m-0", OPERATOR_KPI_CARD_TITLE)}>Evidence basis</p>
                <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {summarizeEvidenceBasis(inspectPayload)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white/85 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                <p className={cn("m-0", OPERATOR_KPI_CARD_TITLE)}>
                  {BUYER_FINDING_SUMMARY_NEXT_STEP_LABEL}
                </p>
                <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {buyerFindingNextStepCopy(inspectPayload, decodedFindingId)}
                </p>
              </div>
            </div>

            <CollapsibleSection title="Finding evaluation confidence" defaultOpen={false}>
              <div className="space-y-2">
                {confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low" ? (
                  <>
                    <FindingConfidenceBadge level={confidenceLevel} />
                    <p className={cn("m-0 leading-snug text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>
                      {BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION}
                    </p>
                  </>
                ) : (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    Confidence not available for this finding.
                  </p>
                )}
              </div>
            </CollapsibleSection>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-teal-100/80 pt-4 dark:border-teal-950/60">
              {graphEvidenceHref !== null ? (
                <Button type="button" asChild variant="default" size="sm" className="shrink-0">
                  <Link href={graphEvidenceHref}>{BUYER_SURFACE_VOCABULARY.evidenceGraphNav}</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {inspectPayload !== null ? (
            <div className="border-t border-teal-100 px-6 py-4 dark:border-teal-950">
              <FindingItsmExportPanel
                runId={runId}
                findingId={decodedFindingId}
                payload={inspectPayload}
              />
            </div>
          ) : null}

          <CollapsibleSection title="Evidence trace details" defaultOpen={false}>
            <FindingProvenancePanel runId={runId} findingId={decodedFindingId} />
          </CollapsibleSection>

          <div className="grid gap-4 p-6 lg:grid-cols-3">
            <div className={cn("p-4", operatorSemanticSurface("warn"))}>
              <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Business impact</h2>
              <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {findingIsPhi
                  ? "If PHI slips outside minimization boundaries at intake, breach notification scope, audit findings, and downstream processing obligations expand. Documented ingress classification and weekly exception monitoring keep this risk within accepted limits."
                  : "This finding is recorded in the finalized governance package with evidence trail linkage."}
              </p>
            </div>
            <div className={cn("p-4", DESIGN_TOKENS.surface.card)}>
              <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Required monitoring</h2>
              <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {mitigationPosture(inspectPayload, decodedFindingId)}
              </p>
            </div>
            <div className={cn("p-4", operatorSemanticSurface("info"))}>
              <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Decision</h2>
              <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {buyerFindingDecisionPanelCopy(inspectPayload, decodedFindingId)}
              </p>
            </div>
          </div>

          <CollapsibleSection title="Acceptance record" defaultOpen={buyerPolishedShell}>
            <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {validationRequirement(inspectPayload, decodedFindingId)}
            </p>
          </CollapsibleSection>

          {findingIsPhi ? (
            <div className="border-t border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
                Focused finding narrative
              </p>
              <p className={cn("m-0 mt-2 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {phiMinimizationBuyerConsequenceNarrative()}
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <header className="space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
            Finding detail
          </p>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{pageTitle}</h1>

          {policyProvenanceModel !== null &&
          (policyProvenanceModel.pack !== null || policyProvenanceModel.policy !== null) ? (
            <FindingPolicyCitationHero model={policyProvenanceModel} traceExcerpt={policyTraceExcerpt} />
          ) : null}

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
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Score {evaluationScore.toFixed(2)}
                </span>
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null && severityRationale.length > 0 ? (
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{severityRationale}</p>
          ) : null}

          {graphEvidenceHref !== null ? (
            <p className="m-0">
              <Link
                className={cn("font-semibold", OPERATOR_LINK.nav)}
                href={graphEvidenceHref}
              >
                View evidence trail
              </Link>
            </p>
          ) : null}

          {inspectPayload !== null ? (
            <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {findingDetailLeadSentence(inspectPayload)}
            </p>
          ) : null}

          {inspectPayload !== null ? (
            <FindingItsmExportPanel runId={runId} findingId={decodedFindingId} payload={inspectPayload} />
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
        <FindingExplainabilityTracePanel runId={runId} findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingInspectContextDebugPanel
          runId={runId}
          findingId={decodedFindingId}
          inspectPayload={inspectPayload}
        />
      ) : null}

      {inspectPayload !== null ? (
        <FindingAskInlinePanel findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingIacStubPanel runId={runId} findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null ? (
        <FindingInspectItsmWorkflowPanel findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Technical identifiers" defaultOpen={false}>
          <dl className={cn("m-0 grid gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
                Finding id
              </dt>
              <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                <code className={cn("max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
                  {decodedFindingId}
                </code>
                <CopyIdButton value={decodedFindingId} aria-label="Copy finding ID" />
              </dd>
            </div>
            {inspectPayload.manifestVersion ? (
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
                  Review record version
                </dt>
                <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{inspectPayload.manifestVersion}</dd>
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
