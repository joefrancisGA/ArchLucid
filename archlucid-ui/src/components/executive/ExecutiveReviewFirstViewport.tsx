import Link from "next/link";
import type { ReactElement } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunExplanationSummary } from "@/types/explanation";

export type ExecutiveReviewFirstViewportProps = {
  readonly runId: string;
  readonly goldenManifestId: string | null | undefined;
  readonly summary: RunExplanationSummary;
};

function manifestDetailHref(runId: string, goldenManifestId: string | null | undefined): string {
  const mid = goldenManifestId?.trim() ?? "";

  if (
    canonicalizeDemoRunId(runId) === SHOWCASE_STATIC_DEMO_RUN_ID &&
    mid === SHOWCASE_STATIC_DEMO_MANIFEST_ID
  ) {
    return getShowcaseManifestHref();
  }

  if (mid.length > 0) {
    return `/manifests/${encodeURIComponent(mid)}`;
  }

  return `/reviews/${encodeURIComponent(runId)}/manifest`;
}

function ratioPercentLabel(value: number | null | undefined, emptyLabel: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return emptyLabel;
  }

  return `${Math.round(value * 100)}%`;
}

function formatAggregateModelConfidence(value: number): string {
  if (value > 1 && value <= 100) {
    return `${Math.round(value)}%`;
  }

  if (value >= 0 && value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  return String(value);
}

function pickRecommendedExecutiveAction(summary: RunExplanationSummary): string {
  const risk = summary.explanation?.riskImplications?.find((r) => r.trim().length > 0)?.trim();

  if (risk !== null && risk !== undefined && risk.length > 0) {
    return risk;
  }

  const driver = summary.explanation?.keyDrivers?.find((d) => d.trim().length > 0)?.trim();

  if (driver !== null && driver !== undefined && driver.length > 0) {
    return driver;
  }

  return "Review prioritized findings below and align control owners on monitored items before the next production change window.";
}

/**
 * Buyer-oriented ordering for the executive view: decision, residual risk, sponsor action, confidence, then deep links.
 */
export function ExecutiveReviewFirstViewport(props: ExecutiveReviewFirstViewportProps): ReactElement {
  const { runId, goldenManifestId, summary } = props;
  const enc = encodeURIComponent(runId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const structuredConfidence = summary.explanation?.structured?.confidence;
  const faithfulnessWarningTrimmed = (summary.faithfulnessWarning ?? "").trim();

  const evidenceConfidenceLine = [
    typeof structuredConfidence === "number" && Number.isFinite(structuredConfidence)
      ? `Aggregate model confidence: ${formatAggregateModelConfidence(structuredConfidence)}.`
      : null,
    typeof summary.faithfulnessSupportRatio === "number" && Number.isFinite(summary.faithfulnessSupportRatio)
      ? `Faithfulness support ratio: ${ratioPercentLabel(summary.faithfulnessSupportRatio, "—")}.`
      : null,
    faithfulnessWarningTrimmed.length > 0 ? faithfulnessWarningTrimmed : null,
    summary.deterministicFallbackUsed === true || summary.usedDeterministicFallback === true
      ? "Some narrative was deterministically aligned to the manifest when live synthesis was unavailable."
      : null,
  ]
    .filter((s): s is string => s !== null && s.length > 0)
    .join(" ");

  const remainingRiskParts = [
    `Residual risk posture: ${summary.riskPosture}.`,
    typeof summary.findingCount === "number" && Number.isFinite(summary.findingCount)
      ? `${Math.trunc(summary.findingCount)} architecture finding${
          Math.trunc(summary.findingCount) === 1 ? "" : "s"
        } surfaced in this review package.`
      : null,
    typeof summary.unresolvedIssueCount === "number" && Number.isFinite(summary.unresolvedIssueCount)
      ? `${summary.unresolvedIssueCount} unresolved manifest issue${
          Math.trunc(summary.unresolvedIssueCount) === 1 ? "" : "s"
        }.`
      : null,
    typeof summary.complianceGapCount === "number" && Number.isFinite(summary.complianceGapCount) &&
    Math.trunc(summary.complianceGapCount) > 0
      ? `${Math.trunc(summary.complianceGapCount)} compliance gap${
          Math.trunc(summary.complianceGapCount) === 1 ? "" : "s"
        } called out in the aggregate assessment.`
      : null,
  ].filter((s): s is string => s !== null && s.length > 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-teal-200/70 shadow-sm dark:border-teal-900/45 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Final decision</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Approved with monitoring — one residual PHI risk under active oversight; no blocking findings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="m-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">{summary.overallAssessment}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Remaining risk</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              What still needs executive or control-owner attention after this review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {remainingRiskParts.map((line, index) => (
              <p key={index} className="m-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                {line}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Recommended executive action
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Highest-signal sponsor move before the next change or steering checkpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="m-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {pickRecommendedExecutiveAction(summary)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Evidence confidence</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              How strongly the synthesized narrative aligns to persisted artifacts and deterministic checks.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="m-0 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {evidenceConfidenceLine.length > 0
                ? evidenceConfidenceLine
                : "Confidence metadata was not returned for this review — use prioritized findings and the manifest package as the authoritative record."}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Review record</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Jump to the finalized signed deliverables and governance checkpoints that anchor this narrative.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="m-0 list-none space-y-2 p-0 text-sm sm:columns-2 sm:gap-x-8 sm:[&>li]:break-inside-avoid">
            <li>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                href={manifestDetailHref(runId, goldenManifestId)}
              >
                View signed manifest
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                href={`/graph?runId=${enc}`}
              >
                View decision traceability graph
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                href={`/governance?runId=${enc}`}
              >
                View governance approval
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                href={`/ask?runId=${enc}`}
              >
                Ask this review
              </Link>
            </li>
            {!buyerPolishedShell ? (
            <li>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                href="/reviews/new"
              >
                Start a follow-up review request
              </Link>
            </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
