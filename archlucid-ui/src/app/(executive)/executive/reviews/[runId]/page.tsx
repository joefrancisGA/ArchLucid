import Link from "next/link";
import { notFound } from "next/navigation";

import { getRunExplanationSummary, getRunSummary } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { severityFromTrace, severitySortRank } from "@/lib/executive-finding-severity";
import { tryStaticDemoExplanationSummary } from "@/lib/operator-static-demo";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import type { FindingTraceConfidenceDto } from "@/types/explanation";
import { ExecutiveReviewFirstViewport } from "@/components/executive/ExecutiveReviewFirstViewport";
import { ExecutiveReviewHandoffActions } from "@/components/executive/ExecutiveReviewHandoffActions";
import { CtoDemoReadOnlySnapshotBanner } from "@/components/cto-demo/CtoDemoReadOnlySnapshotBanner";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import { CtoDemoExecutiveTenantIsolationCallout } from "@/components/cto-demo/CtoDemoExecutiveTenantIsolationCallout";
import {
  CtoDemoExecutiveAboveFold,
  CtoDemoFindingEvidenceLink,
  traceRowsToCtoDemoTopRisks,
} from "@/components/executive/CtoDemoExecutiveAboveFold";
import type { ExecutiveRiskReviewFindingMarkdownRow } from "@/lib/executive-risk-review-markdown";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";

type ExecutiveFindingRow = {
  findingId: string;
  title: string;
  severity: string;
  confidence: string;
  recommended: string;
};

function traceToRows(traces: FindingTraceConfidenceDto[]): ExecutiveFindingRow[] {
  const withTrace = traces
    .filter((t) => (t.findingId ?? "").trim().length > 0)
    .map((t) => {
      const findingId = t.findingId.trim();
      const titleRaw = (t.findingTitle ?? findingId).trim();
      const ruleHint = (t.ruleId ?? "").trim();

      const row: ExecutiveFindingRow = {
        findingId,
        title: titleRaw.length > 0 ? titleRaw : findingId,
        severity: severityFromTrace(t.traceConfidenceLabel),
        confidence:
          (t.traceConfidenceLabel ?? "—").trim().length > 0 ? String(t.traceConfidenceLabel).trim() : "—",
        recommended:
          ruleHint.length > 0
            ? `Review finding tied to rule ${ruleHint}.`
            : "See finding detail for recommended next steps.",
      };

      return { row, sortKey: severitySortRank(t.traceConfidenceLabel) };
    });

  withTrace.sort((a, b) => a.sortKey - b.sortKey);

  return withTrace.map((x) => x.row);
}

function traceToMarkdownFindingRows(traces: FindingTraceConfidenceDto[]): ExecutiveRiskReviewFindingMarkdownRow[] {
  return traceToRows(traces).map((row) => ({
    findingId: row.findingId,
    title: row.title,
    severity: row.severity,
    recommended: row.recommended,
  }));
}

function findingExecutiveHref(runId: string, findingId: string): string {
  return `/executive/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`;
}

/**
 * Single-review executive summary: first-viewport narrative, severity-sorted findings, DOCX package + Markdown handoff.
 */
export default async function ExecutiveReviewFindingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ readOnly?: string }>;
}) {
  const { runId } = await params;
  const query = await searchParams;
  const readOnlySnapshot = query.readOnly === "1" || query.readOnly === "true";

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  let summary: Awaited<ReturnType<typeof getRunExplanationSummary>> | null = null;
  let runSummary: Awaited<ReturnType<typeof getRunSummary>> | null = null;
  let failure: ApiLoadFailureState | null = null;

  try {
    runSummary = await getRunSummary(runId);
  } catch (e) {
    if (isApiNotFoundFailure(toApiLoadFailure(e))) {
      notFound();
    }
  }

  try {
    summary = await getRunExplanationSummary(runId);
  } catch (e) {
    const f = toApiLoadFailure(e);

    if (isApiNotFoundFailure(f)) {
      notFound();
    }

    failure = f;
  }

  if (summary === null || (typeof summary.findingCount === "number" && summary.findingCount === 0 && summary.riskPosture !== "Approved with monitoring")) {
    const staticFallback = tryStaticDemoExplanationSummary(runId);

    if (staticFallback !== null) {
      summary = staticFallback;
      failure = null;
    }
  }

  const headline =
    runSummary !== null && (runSummary.description ?? "").trim().length > 0
      ? (runSummary.description ?? "").trim()
      : runId;

  const traces =
    summary?.findingTraceConfidences ?? summary?.explanation?.findingTraceConfidences ?? [];
  const rows = traceToRows(traces ?? []);
  const markdownRows = traceToMarkdownFindingRows(traces ?? []);
  const ctoDemoPack = isCtoDemoPackEnv();
  const ctoDemoTopRisks = traceRowsToCtoDemoTopRisks(traces ?? []);

  return (
    <div className="space-y-6" data-testid="executive-review-page">
      {readOnlySnapshot ? <CtoDemoReadOnlySnapshotBanner /> : null}
      <CtoDemoBuyerValueStrip stepIndex={0} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/executive/reviews"
          className="font-medium text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
        >
          ← All reviews
        </Link>
        <span className="text-neutral-400 dark:text-neutral-600" aria-hidden>
          |
        </span>
        <Link
          href={`/reviews/${encodeURIComponent(runId)}`}
          className="text-neutral-600 underline hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Open review package
        </Link>
      </div>

      {summary !== null && ctoDemoPack ? (
        <CtoDemoExecutiveAboveFold
          runId={runId}
          headline={headline}
          summary={summary}
          topRisks={ctoDemoTopRisks}
        />
      ) : (
        <header className="space-y-2 rounded-xl border border-neutral-200 bg-gradient-to-br from-teal-50/60 via-white to-transparent px-4 py-4 shadow-sm dark:border-neutral-800 dark:from-teal-950/25 dark:via-neutral-950 dark:to-transparent sm:px-5">
          <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
            Executive summary
          </p>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">{headline}</h1>
          {summary !== null ? (
            <p className="m-0 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Risk posture:</span>{" "}
              {summary.riskPosture}
            </p>
          ) : null}
          <CtoDemoExecutiveTenantIsolationCallout />
        </header>
      )}

      {failure !== null && summary === null ? (
        <Card className="border-rose-600/40 bg-al-surface-raised dark:border-rose-800/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              Could not load review summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">{failure.message}</p>
            {failure.httpStatus !== null ? (
              <p className="m-0 mt-2 text-xs text-neutral-500">HTTP {failure.httpStatus}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {summary !== null ? (
        <ExecutiveReviewFirstViewport runId={runId} goldenManifestId={undefined} summary={summary} />
      ) : null}

      {summary !== null ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
            <h2 className="m-0 text-sm font-semibold text-al-text-primary">Prioritized findings</h2>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/50">
              <ExecutiveReviewHandoffActions
                runId={runId}
                headline={headline}
                summary={summary}
                prioritizedFindings={markdownRows}
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
              No findings were identified in this review package.
            </p>
          ) : (
            <div className="hidden md:block">
              <EnterpriseTable ariaLabel="Prioritized findings">
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Finding</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Recommended action</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Evidence</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {rows.map((row) => (
                    <EnterpriseTableRow key={row.findingId}>
                      <EnterpriseTableCell>
                        <SeverityTag severity={row.severity} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="font-medium">
                        <Link
                          className="text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                          href={findingExecutiveHref(runId, row.findingId)}
                        >
                          {row.title}
                        </Link>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="text-xs text-al-text-secondary">
                        {row.confidence}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="text-xs text-al-text-secondary">
                        {row.recommended}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <CtoDemoFindingEvidenceLink runId={runId} findingId={row.findingId} />
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </div>
          )}

          {rows.length > 0 ? (
            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <Card key={row.findingId} className="border border-neutral-200 shadow-sm dark:border-neutral-800">
                  <CardHeader className="space-y-1 pb-2">
                    <CardDescription className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {row.severity} · {row.confidence}
                    </CardDescription>
                    <p className="m-0 text-sm font-semibold text-al-text-primary">
                      <Link
                        className="text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                        href={findingExecutiveHref(runId, row.findingId)}
                      >
                        {row.title}
                      </Link>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">{row.recommended}</p>
                    <CtoDemoFindingEvidenceLink runId={runId} findingId={row.findingId} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
