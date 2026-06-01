"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { operatorSemanticSurface } from "@/lib/design-tokens";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { cn } from "@/lib/utils";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  isAgentOutputPilotStrictSponsorSafe,
  type PilotRunDeltasProofSummaryJson,
} from "@/lib/pilot-proof-readiness";

type LoadState = "loading" | "ok" | "error" | "skipped";

/** Surfaces PilotStrict / AI readiness posture on committed review detail before sponsor send. */
export function RunDetailAiReadinessGateCard(props: { readonly runId: string; readonly manifestId: string | null }) {
  const { runId, manifestId } = props;
  const [state, setState] = useState<LoadState>("loading");
  const [payload, setPayload] = useState<PilotRunDeltasProofSummaryJson | null>(null);

  useEffect(() => {
    if (manifestId === null || manifestId.trim().length === 0) {
      setState("skipped");

      return;
    }

    let cancelled = false;
    const headers = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
    const url = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/pilot-run-deltas`;

    async function load(): Promise<void> {
      try {
        const response = await fetch(url, headers);

        if (!response.ok) {
          if (!cancelled) {
            setState("error");
          }

          return;
        }

        const json = (await response.json()) as PilotRunDeltasProofSummaryJson;

        if (!cancelled) {
          setPayload(json);
          setState("ok");
        }
      }
      catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [runId, manifestId]);

  if (state === "skipped") {
    return null;
  }

  if (state === "loading") {
    return (
      <div
        className="mb-4 min-h-[4rem] rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="run-detail-ai-readiness-gate-loading"
        aria-hidden
      />
    );
  }

  if (state === "error" || payload === null) {
    return (
      <div
        className={cn("mb-4 px-4 py-3 text-sm", operatorSemanticSurface("warn"))}
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
      className={cn(
        "mb-4 px-4 py-3 text-sm",
        pilotStrictOk ? operatorSemanticSurface("ready") : operatorSemanticSurface("warn"),
      )}
      data-testid="run-detail-ai-readiness-gate"
    >
      <p className="m-0 font-semibold">
        {pilotStrictOk ? "AI readiness: PilotStrict satisfied" : "AI readiness: HOLD — review before sponsor send"}
      </p>
      <p className="m-0 mt-1 text-xs leading-relaxed opacity-95">
        {pilotStrictOk
          ? "No PilotStrict trace or faithfulness failures are attested for this committed review on real-mode hosts."
          : "PilotStrict quality signals failed or are unresolved. Open the first-value report and observability summary before external PDF send."}
        {llmResolved && typeof llmCalls === "number" ? (
          <>
            {" "}
            LLM calls on this run: <span className="font-mono tabular-nums">{llmCalls}</span>.
          </>
        ) : null}
      </p>
      <p className="m-0 mt-2 text-xs">
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
