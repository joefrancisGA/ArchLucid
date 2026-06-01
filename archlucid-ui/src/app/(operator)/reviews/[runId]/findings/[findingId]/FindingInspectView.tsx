import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  findingDetailHeadingTitle,
  findingDetailLeadSentence,
  findingInspectPageEyebrow,
} from "@/lib/finding-display-from-inspect";
import { findingIdsAlignForInspectRoute } from "@/lib/load-finding-inspect-for-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
      <div className="mx-auto max-w-6xl space-y-4 p-6">
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
      <div className="mx-auto max-w-6xl space-y-4 p-6">
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
      <div className="mx-auto max-w-6xl space-y-4 p-6">
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
  const inspectHeroTitle = buyerPolishedShell ? "Technical evidence trail" : `${findingTitle} — evidence & trace`;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(decodedFindingId)}`}
          className="text-sm font-semibold text-al-text-primary text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
        >
          ← {buyerPolishedShell ? "Back to finding detail" : "Finding detail"}
        </Link>
      </div>

      {buyerPolishedShell ? (
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          <span className="rounded-sm bg-neutral-200 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
            Appendix
          </span>
          <span>
            Technical traceability appendix — source evidence, trace path, and audit metadata for this finding. Not
            part of the governed decision summary.
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
        {!buyerPolishedShell ? (
          <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Finding <span className="font-mono text-xs">{decodedFindingId}</span> — manifest{" "}
            <span className="font-mono text-xs">{payload.manifestVersion ?? "—"}</span>
          </p>
        ) : null}
      </header>

      <FindingInspectFindingBody
        runId={runId}
        decodedFindingId={decodedFindingId}
        payload={payload}
        variant="inspect"
      />

      <FindingInspectGovernanceStickinessPanel findingId={decodedFindingId} runId={runId} />

      <FindingInspectItsmWorkflowPanel findingId={decodedFindingId} />

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
