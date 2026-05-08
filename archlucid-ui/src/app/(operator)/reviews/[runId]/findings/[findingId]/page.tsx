import Link from "next/link";

import { notFound } from "next/navigation";

import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorEvidenceLimitsFooter } from "@/components/OperatorEvidenceLimitsFooter";
import { Badge } from "@/components/ui/badge";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  loadFindingInspectForRoute,
  shouldTreatFindingInspectFailureAsNotFound,
} from "@/lib/load-finding-inspect-for-route";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  findingDetailHeadingTitle,
  findingDetailLeadSentence,
  findingInspectPrimaryLabels,
} from "@/lib/finding-display-from-inspect";

import { isInvalidDynamicRouteToken, isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { FindingInspectFindingBody } from "./FindingInspectFindingBody";

/**
 * Finding detail: severity and narrative first; technical identifiers and export tools collapsed.
 */
export default async function RunFindingExplainPage({
  params,
}: {
  params: Promise<{ runId: string; findingId: string }>;
}) {
  const { runId, findingId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (isInvalidDynamicRouteToken(findingId)) {
    notFound();
  }

  const decodedFindingId = decodeURIComponent(findingId);

  const { payload: inspectPayloadRaw, failure: inspectFailureRaw, invalidRouteAlignment } =
    await loadFindingInspectForRoute(runId, decodedFindingId);

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(inspectFailureRaw)) {
    notFound();
  }

  const inspectPayload: FindingInspectPayload | null = inspectPayloadRaw;
  const inspectFailure: ApiLoadFailureState | null = inspectFailureRaw;

  const runExecutionFootnote = await tryLoadRunExecutionFootnote(runId);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const labels = inspectPayload !== null ? findingInspectPrimaryLabels(inspectPayload) : null;

  const pageTitle =
    inspectPayload !== null ? findingDetailHeadingTitle(inspectPayload) : "Finding detail";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/reviews/${encodeURIComponent(runId)}`}
          className="font-medium text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-neutral-600 dark:hover:text-teal-200"
        >
          ← Back to review
        </Link>
        <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
          ·
        </span>
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(decodedFindingId)}/inspect`}
          className="text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-neutral-600 dark:hover:text-teal-200"
        >
          {buyerPolishedShell ? "Traceability view (rules, citations, payload)" : "Technical inspection trail"}
        </Link>
      </nav>

      {buyerPolishedShell ? (
        <div className="rounded-xl border-2 border-teal-300/70 bg-gradient-to-b from-teal-50/90 to-white p-5 shadow-sm dark:border-teal-800/70 dark:from-teal-950/40 dark:to-neutral-950">
          <header className="space-y-3 border-b border-teal-200/60 pb-4 dark:border-teal-900/50">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Finding detail (sponsor summary)
            </p>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{pageTitle}</h1>

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

            {inspectPayload !== null ? (
              <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {findingDetailLeadSentence(inspectPayload)}
              </p>
            ) : null}
          </header>
        </div>
      ) : (
        <header className="space-y-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Finding detail
          </p>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{pageTitle}</h1>

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
        <CollapsibleSection title="Export for remediation ticket" defaultOpen={false}>
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Copy a structured summary formatted for your issue tracker (Markdown, GitHub Issues, Azure Boards, or Jira).
          </p>
          <div className="pt-3">
            <CopyFindingAsWorkItemButton findingId={decodedFindingId} payload={inspectPayload} runId={runId} />
          </div>
        </CollapsibleSection>
      ) : null}

      {inspectPayload !== null ? (
        <CollapsibleSection title="Technical identifiers" defaultOpen={false}>
          <dl className="m-0 grid gap-2 text-sm text-neutral-800 dark:text-neutral-200">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Finding id
              </dt>
              <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono dark:bg-neutral-800">
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
        title={buyerPolishedShell ? "Technical audit trail (optional)" : "Technical audit trail"}
        defaultOpen={false}
      >
        <FindingExplainPanel
          runId={runId}
          findingId={findingId}
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
    </main>
  );
}
