import Link from "next/link";

import { ExplanationEvidenceBasisBadges } from "@/components/ExplanationEvidenceBasisBadges";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  DEMO_PREVIEW_CONDITIONS_LABEL,
  DEMO_PREVIEW_EVIDENCE_BASIS_LABEL,
  DEMO_PREVIEW_EVIDENCE_BASIS_TEXT,
  DEMO_PREVIEW_SPONSOR_CONCLUSION_HEADING,
  DEMO_PREVIEW_RECOMMENDATION_LABEL,
  DEMO_PREVIEW_SUPPORTING_EVIDENCE_LABEL,
} from "@/lib/demo-preview-page-copy";
import { buildDemoPreviewConditionsText } from "@/lib/demo-preview-present";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { ShowcaseDemoPreviewTelemetry } from "@/lib/marketing/showcase-telemetry";
import { ShowcaseFunnelTelemetryAnchor } from "@/lib/marketing/showcase-funnel-telemetry-anchor";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { isDeterministicExplanationFallback } from "@/types/explanation";
import { cn } from "@/lib/utils";

type DemoPreviewSponsorConclusionProps = {
  readonly payload: DemoCommitPagePreviewResponse;
};

export function DemoPreviewSponsorConclusion(props: DemoPreviewSponsorConclusionProps) {
  const runExplanation = props.payload.runExplanation;
  const citationCount = Array.isArray(runExplanation?.citations) ? runExplanation.citations.length : 0;
  const recommendation =
    runExplanation?.overallAssessment?.trim() ??
    "Proceed with claims intake modernization under monitored PHI-minimization controls.";
  const conditions = buildDemoPreviewConditionsText(runExplanation?.themeSummaries);

  return (
    <section
      id="artifact-sponsor-report"
      className="scroll-mt-24 rounded-xl border border-neutral-200 bg-al-surface-raised p-5 dark:border-neutral-800"
      data-testid="demo-preview-sponsor-conclusion"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {DEMO_PREVIEW_SPONSOR_CONCLUSION_HEADING}
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_RECOMMENDATION_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>{recommendation}</p>
        </div>

        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_EVIDENCE_BASIS_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {DEMO_PREVIEW_EVIDENCE_BASIS_TEXT}
          </p>
        </div>

        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_CONDITIONS_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{conditions}</p>
        </div>

        <div>
          <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.cardTitle)}>
            {DEMO_PREVIEW_SUPPORTING_EVIDENCE_LABEL}
          </p>
          <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {citationCount} citations · Evidence-backed ·{" "}
            {props.payload.manifest ? manifestStatusForDisplay(props.payload.manifest.status) : "Finalized"} record
          </p>
          <div className="mt-3">
            <ExplanationEvidenceBasisBadges
              citationCount={citationCount}
              faithfulnessSupportRatio={runExplanation?.faithfulnessSupportRatio}
              deterministicFallbackUsed={runExplanation ? isDeterministicExplanationFallback(runExplanation) : false}
              demoDerived
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function DemoPreviewSignedReviewSection(props: DemoPreviewSponsorConclusionProps) {
  const manifest = props.payload.manifest;

  return (
    <section
      id="artifact-signed-review-record"
      className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="demo-preview-signed-review-section"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Sealed review record
      </h2>
      {manifest?.operatorSummary ? (
        <p className={cn("m-0 mt-3 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
          {manifest.operatorSummary}
        </p>
      ) : null}
      {manifest ? (
        <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.body)}>
          Policy pack: {policyPackBuyerLabel(manifest.ruleSetId ?? "", manifest.ruleSetVersion ?? "")} · Status:{" "}
          {manifestStatusForDisplay(manifest.status)}
        </p>
      ) : null}
      {manifest?.manifestId ? (
        <p className="mt-4">
          <Link
            href={signedRecordDetailPath(manifest.manifestId)}
            className={MARKETING_SURFACES.inlineLink}
          >
            Open sealed review record
          </Link>
        </p>
      ) : null}
    </section>
  );
}

export function DemoPreviewEvidenceGraphSection(
  props: DemoPreviewSponsorConclusionProps & { readonly showcaseTelemetry?: ShowcaseDemoPreviewTelemetry },
) {
  const citations = Array.isArray(props.payload.runExplanation?.citations) ? props.payload.runExplanation.citations : [];
  const runId = props.payload.run?.runId ?? "";

  return (
    <section
      id="artifact-evidence-graph"
      className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="demo-preview-evidence-graph-section"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Evidence graph
      </h2>
      <p className={cn("m-0 mt-3 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        Trace how review conclusions connect to captured context, graph evidence, and finalized findings in this sample
        package.
      </p>
      {citations.length > 0 ? (
        <ul className="m-0 mt-4 list-disc space-y-2 pl-5">
          {citations.map((citation) => (
            <li key={`${citation.kind}-${citation.id}`} className={cn("text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
              {citation.label}
            </li>
          ))}
        </ul>
      ) : null}
      {runId.length > 0 ? (
        <p className="mt-4">
          {props.showcaseTelemetry ? (
            <ShowcaseFunnelTelemetryAnchor
              href={`/insights/evidence-graph?runId=${encodeURIComponent(runId)}`}
              className={MARKETING_SURFACES.inlineLink}
              scenario={props.showcaseTelemetry.scenario}
              renderMode={props.showcaseTelemetry.renderMode}
              funnelAction="evidence_trace_open"
            >
              View evidence graph
            </ShowcaseFunnelTelemetryAnchor>
          ) : (
            <Link
              href={`/insights/evidence-graph?runId=${encodeURIComponent(runId)}`}
              className={MARKETING_SURFACES.inlineLink}
            >
              View evidence graph
            </Link>
          )}
        </p>
      ) : null}
    </section>
  );
}

export function DemoPreviewGovernanceSection(props: DemoPreviewSponsorConclusionProps) {
  const manifest = props.payload.manifest;
  const runId = props.payload.run?.runId ?? "";

  return (
    <section
      id="artifact-governance-approval"
      className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="demo-preview-governance-section"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        Resolve outcomes
      </h2>
      <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        Resolve outcomes recorded with monitored conditions for PHI handling and intake continuity.
      </p>
      {manifest ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Decisions</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {manifest.decisionCount}
            </dd>
          </div>
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Monitored risks</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {manifest.warningCount}
            </dd>
          </div>
          <div>
            <dt className={cn("text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>Unresolved issues</dt>
            <dd className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {manifest.unresolvedIssueCount}
            </dd>
          </div>
        </dl>
      ) : null}
      {runId.length > 0 ? (
        <p className="mt-4">
          <Link
            href={`/governance/approval-queue?runId=${encodeURIComponent(runId)}`}
            className={MARKETING_SURFACES.inlineLink}
          >
            View approval
          </Link>
        </p>
      ) : null}
    </section>
  );
}
