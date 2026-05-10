import Link from "next/link";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { findingDetailHeadingTitle, findingDetailLeadSentence } from "@/lib/finding-display-from-inspect";
import { findingIdsAlignForInspectRoute } from "@/lib/load-finding-inspect-for-route";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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
  const inspectHeroTitle = buyerPolishedShell ? `Traceability: ${findingTitle}` : `Technical inspection — ${findingTitle}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(decodedFindingId)}`}
          className="text-base font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
        >
          ← {buyerPolishedShell ? "Back to finding overview" : "Finding detail"}
        </Link>
      </div>

      <header
        className={
          buyerPolishedShell
            ? "space-y-3 rounded-xl border-2 border-violet-300/60 bg-violet-50/50 p-5 dark:border-violet-900/50 dark:bg-violet-950/30"
            : "space-y-3"
        }
      >
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{inspectHeroTitle}</h1>
        <p className="m-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {findingDetailLeadSentence(payload)}
        </p>
        <p className="m-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {buyerPolishedShell
            ? "Below: cited evidence, rule linkage, typed finding payload, reasoning trace, and audit correlation. Use finding overview for the sponsor summary first."
            : "This view adds rule identifiers, citations, typed payload, and reasoning trace. Use Finding detail (link above) for the product summary; use this view for full traceability."}
        </p>
        <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Finding <span className="font-mono text-xs">{decodedFindingId}</span> — manifest{" "}
          <span className="font-mono text-xs">{payload.manifestVersion ?? "—"}</span>
        </p>
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
