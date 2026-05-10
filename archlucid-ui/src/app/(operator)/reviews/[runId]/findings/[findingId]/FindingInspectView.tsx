import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  findingDetailHeadingTitle,
  findingDetailLeadSentence,
  findingInspectPageEyebrow,
  isPhiMinimizationSampleFinding,
} from "@/lib/finding-display-from-inspect";
import { findingIdsAlignForInspectRoute } from "@/lib/load-finding-inspect-for-route";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import { FindingInspectFindingBody } from "./FindingInspectFindingBody";

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

function typedPayloadKeys(payload: FindingInspectPayload): string[] {
  if (payload.typedPayload === null || payload.typedPayload === undefined || typeof payload.typedPayload !== "object") {
    return [];
  }

  return Object.keys(payload.typedPayload as Record<string, unknown>).sort((a, b) => a.localeCompare(b));
}

function evidenceReferences(payload: FindingInspectPayload): string[] {
  const refs = payload.evidence
    .map((row) => row.artifactId?.trim() ?? null)
    .filter((value): value is string => value !== null && value.length > 0);

  if (refs.length > 0) {
    return refs.slice(0, 3);
  }

  if (isPhiMinimizationSampleFinding(payload)) {
    return ["ctx-snapshot-01", "graph-snapshot-01", "find-snapshot-01"];
  }

  return [];
}

function graphNodeIds(payload: FindingInspectPayload): string[] {
  if (isPhiMinimizationSampleFinding(payload)) {
    return ["n-phi", "n-find", "n-manifest"];
  }

  return [];
}

function lineageSummary(payload: FindingInspectPayload): string {
  if (isPhiMinimizationSampleFinding(payload)) {
    return "Context snapshot → evidence graph → findings snapshot → PHI minimization finding → manifest decision → audit trail.";
  }

  return "Decision rule → finding record → manifest version; correlated review events appear in the audit trail when available.";
}

function auditHref(runId: string, payload: FindingInspectPayload): string {
  const base = `/audit?runId=${encodeURIComponent(runId)}`;

  if (payload.auditRowId !== null && payload.auditRowId.trim().length > 0) {
    return `${base}&eventId=${encodeURIComponent(payload.auditRowId.trim())}`;
  }

  return base;
}

function payloadMetadataSummary(payload: FindingInspectPayload): string {
  const keyCount = typedPayloadKeys(payload).length;
  const evidenceCount = payload.evidence.length;
  const actionCount = payload.recommendedActions.filter((a) => a.trim().length > 0).length;

  return `${keyCount} payload field${keyCount === 1 ? "" : "s"}; ${evidenceCount} evidence row${evidenceCount === 1 ? "" : "s"}; ${actionCount} recommended action${actionCount === 1 ? "" : "s"}.`;
}

function TraceCard({ label, value, href }: { readonly label: string; readonly value: string; readonly href?: string }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-white/85 p-3 dark:border-violet-900/60 dark:bg-neutral-950/70">
      <p className="m-0 text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">{label}</p>
      {href ? (
        <Link className="mt-1 block break-words text-sm font-semibold text-violet-950 underline underline-offset-2 dark:text-violet-100" href={href}>
          {value}
        </Link>
      ) : (
        <p className="m-0 mt-1 break-words text-sm font-semibold text-neutral-950 dark:text-neutral-100">{value}</p>
      )}
    </div>
  );
}

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
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Link href={`/reviews/${encodeURIComponent(runId)}`} className="text-sm text-sky-700 underline dark:text-sky-300">
          ← Back to review
        </Link>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Technical inspection</h1>
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
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          This finding belongs to run <span className="font-mono">{payload.runId}</span>, not the run in this URL.
        </p>
        <Link
          href={`/reviews/${encodeURIComponent(payload.runId)}/findings/${encodeURIComponent(decodedFindingId)}/inspect`}
          className="text-sky-700 underline dark:text-sky-300"
        >
          Open the correct inspector
        </Link>
      </div>
    );
  }

  if (!findingIdsAlignForInspectRoute(decodedFindingId, payload.findingId)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          This inspection payload corresponds to finding{" "}
          <span className="font-mono">{payload.findingId}</span>, not{" "}
          <span className="font-mono">{decodedFindingId}</span>.
        </p>
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(payload.findingId)}/inspect`}
          className="text-sky-700 underline dark:text-sky-300"
        >
          Open the inspector for finding {payload.findingId}
        </Link>
      </div>
    );
  }

  const findingTitle = findingDetailHeadingTitle(payload);
  const inspectHeroTitle = `${findingTitle} — technical traceability`;
  const evidenceRefs = evidenceReferences(payload);
  const nodeIds = graphNodeIds(payload);
  const metadataKeys = typedPayloadKeys(payload);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(decodedFindingId)}`}
          className="text-base font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
        >
          ← {buyerPolishedShell ? "Back to finding detail" : "Finding detail"}
        </Link>
      </div>

      <header
        className={
          buyerPolishedShell
            ? "overflow-hidden rounded-2xl border border-violet-300 bg-white shadow-sm dark:border-violet-900 dark:bg-neutral-950"
            : "space-y-3"
        }
      >
        {buyerPolishedShell ? (
          <>
            <div className="border-b border-violet-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-6 dark:border-violet-950 dark:from-violet-950/50 dark:via-neutral-950 dark:to-slate-950/30">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-violet-800 dark:text-violet-200">
                {findingInspectPageEyebrow(payload)}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {inspectHeroTitle}
              </h1>
              <p className="m-0 mt-3 max-w-3xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                This route answers <strong>how this finding was derived</strong>: which source evidence was referenced,
                which rule created the finding, which graph nodes carry the risk, which identifiers are stable, and which
                audit events support review or reproduction.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <TraceCard label="Derivation path" value={lineageSummary(payload)} />
                <TraceCard label="Source evidence" value={evidenceRefs.length > 0 ? evidenceRefs.join(" · ") : "No source evidence rows attached"} />
                <TraceCard label="Stable finding id" value={decodedFindingId} />
                <TraceCard label="Audit event link" value={payload.auditRowId ?? "Open audit trail"} href={auditHref(runId, payload)} />
              </div>
            </div>

            <div className="grid gap-4 p-6 lg:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                <h2 className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Event lineage</h2>
                <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {lineageSummary(payload)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                <h2 className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Payload metadata</h2>
                <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {payloadMetadataSummary(payload)}
                </p>
                {metadataKeys.length > 0 ? (
                  <p className="m-0 mt-2 break-words font-mono text-xs text-neutral-600 dark:text-neutral-400">
                    {metadataKeys.slice(0, 8).join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                <h2 className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-100">Graph node ids</h2>
                <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {nodeIds.length > 0 ? nodeIds.join(" → ") : "No graph node ids are exposed for this finding payload."}
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Technical traceability summary
              </p>
              <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                Rule <span className="font-mono">{payload.decisionRuleId ?? payload.decisionRuleName ?? "—"}</span> produced
                finding <span className="font-mono">{decodedFindingId}</span> against manifest{" "}
                <span className="font-mono">{payload.manifestVersion ?? "—"}</span>. Model deployment{" "}
                <span className="font-mono">{payload.modelDeploymentName ?? "—"}</span> and prompt template{" "}
                <span className="font-mono">{payload.promptTemplateVersion ?? "—"}</span> are shown when the API returns them.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
              {findingInspectPageEyebrow(payload)}
            </p>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{inspectHeroTitle}</h1>
            <p className="m-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {findingDetailLeadSentence(payload)}
            </p>
            <ul className="m-0 list-disc space-y-1.5 py-1 pl-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <li>
                <strong className="font-medium text-neutral-900 dark:text-neutral-100">Source evidence:</strong> citations,
                snapshots, and structured payload fields persisted with this finding.
              </li>
              <li>
                <strong className="font-medium text-neutral-900 dark:text-neutral-100">Trace path:</strong> decision rule →
                finding record → manifest version; correlated events appear in the audit trail.
              </li>
              <li>
                <strong className="font-medium text-neutral-900 dark:text-neutral-100">Audit metadata:</strong> model and
                template versions (when present) support reproducibility — open the reference section below for full detail.
              </li>
            </ul>
            <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Finding <span className="font-mono text-xs">{decodedFindingId}</span> — manifest{" "}
              <span className="font-mono text-xs">{payload.manifestVersion ?? "—"}</span>
            </p>
          </>
        )}
      </header>

      <FindingInspectFindingBody
        runId={runId}
        decodedFindingId={decodedFindingId}
        payload={payload}
        variant="inspect"
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
