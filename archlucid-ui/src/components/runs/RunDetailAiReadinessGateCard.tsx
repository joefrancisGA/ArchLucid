"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { usePilotRunDeltasQuery } from "@/hooks/use-pilot-run-deltas-query";
import { OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { isAgentOutputPilotStrictSponsorSafe } from "@/lib/pilot-proof-readiness";

/** Surfaces strict AI quality / AI readiness posture on committed review detail before sponsor send. */
export function RunDetailAiReadinessGateCard(props: { readonly runId: string; readonly manifestId: string | null }) {
  const { runId, manifestId } = props;
  // An uncommitted review has no persisted proof signals to gate on.
  const committed = manifestId !== null && manifestId.trim().length > 0;
  const {
    data: payload,
    isPending,
    isError,
  } = usePilotRunDeltasQuery(runId, { enabled: committed });

  if (!committed) {
    return null;
  }

  if (isPending) {
    return (
      <div
        className="mb-4 min-h-[4rem] rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="run-detail-ai-readiness-gate-loading"
        aria-hidden
      />
    );
  }

  if (isError || payload == null) {
    return (
      <div
        className={cn("mb-4 px-4 py-3", OPERATOR_TYPOGRAPHY.body, operatorSemanticSurface("warn"))}
        data-testid="run-detail-ai-readiness-gate-error"
      >
        AI readiness signals could not be loaded. Review the first-value Markdown report before sponsor send.
      </div>
    );
  }

  const pilotStrictOk = isAgentOutputPilotStrictSponsorSafe(payload);
  const llmCalls = payload.proofPackageCompleteness?.llmCallCount;
  const llmResolved = payload.proofPackageCompleteness?.llmCallCountResolved === true;

  return (
    <div
      className={cn("mb-4 px-4 py-3", OPERATOR_TYPOGRAPHY.body,
        pilotStrictOk ? operatorSemanticSurface("ready") : operatorSemanticSurface("warn"),
      )}
      data-testid="run-detail-ai-readiness-gate"
    >
      <p className="m-0 font-semibold">
        {pilotStrictOk ? "AI readiness: Strict quality checks passed" : "AI readiness: HOLD — review before sponsor send"}
      </p>
      <p className={cn("m-0 mt-1 leading-relaxed opacity-95", OPERATOR_TYPOGRAPHY.helper)}>
        {pilotStrictOk
          ? "No strict AI quality trace or faithfulness failures are attested for this committed review on real-mode hosts."
          : "Strict AI quality signals failed or are unresolved. Open the first-value report and observability summary before external PDF send."}
        {llmResolved && typeof llmCalls === "number" ? (
          <>
            {" "}
            LLM calls on this review: <span className="font-mono tabular-nums">{llmCalls}</span>.
          </>
        ) : null}
      </p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          href={`/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`}
          className="font-medium underline underline-offset-2"
        >
          First-value report
        </Link>
        {" · "}
        <Link
          href={resolveInAppDocHref("docs/library/AGENT_OUTPUT_EVALUATION.md")}
          className="font-medium underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          AI readiness gate docs
        </Link>
      </p>
    </div>
  );
}
