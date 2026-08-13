"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import {
  describeSponsorProofReadiness,
  formatStructuralExecutionModeLabel,
  isProjectedDollarClaimsSponsorSafe,
  type PilotRunDeltasProofSummaryJson,
} from "@/lib/pilot-proof-readiness";
import {
  buildPilotRoiValidationChecklistMarkdown,
  describeRoiEvidenceConfidence,
  PILOT_ROI_VALIDATION_INTERVIEW_QUESTIONS,
  resolvePilotRoiValidationVerdict,
  type PilotRoiValidationVerdict,
} from "@/lib/pilot-roi-validation-handoff";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type PilotRoiValidationHandoffCardProps = {
  readonly runId: string;
  readonly payload: PilotRunDeltasProofSummaryJson | null;
  readonly curatedSampleRun?: boolean;
  readonly className?: string;
};

function verdictStatusKind(verdict: PilotRoiValidationVerdict): "ready" | "needs-attention" | "blocked" {
  if (verdict === "sendable") {
    return "ready";
  }

  if (verdict === "internal-only") {
    return "needs-attention";
  }

  return "blocked";
}

function verdictBorderClass(verdict: PilotRoiValidationVerdict): string {
  if (verdict === "sendable") {
    return "border-emerald-700/40 bg-al-surface-raised dark:border-emerald-800/50";
  }

  if (verdict === "internal-only") {
    return "border-amber-600/40 bg-al-surface-raised dark:border-amber-700/50";
  }

  return "border-rose-700/40 bg-al-surface-raised dark:border-rose-800/50";
}

export function PilotRoiValidationHandoffCard(props: PilotRoiValidationHandoffCardProps) {
  const { runId, payload, curatedSampleRun = false, className } = props;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const verdictCopy = resolvePilotRoiValidationVerdict(payload, { curatedSampleRun });
  const roi = describeRoiEvidenceConfidence(payload?.proofPackageCompleteness?.roiEvidenceConfidence);
  const readiness = describeSponsorProofReadiness(payload);
  const executionMode = formatStructuralExecutionModeLabel(payload);
  const dollarSafe = isProjectedDollarClaimsSponsorSafe(payload);
  const validationSessionHref = resolveInAppDocHref(
    "docs/go-to-market/validation/PAID_PILOT_EVIDENCE_LEDGER.md#pilot-roi-validation-session",
  );
  const firstRunHelpHref = "/help/first-run";

  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (copyState !== "copied") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyState("idle");
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyState]);

  async function onCopyChecklist(): Promise<void> {
    try {
      await navigator.clipboard.writeText(buildPilotRoiValidationChecklistMarkdown(runId, payload));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section
      className={cn("rounded-md border p-4", verdictBorderClass(verdictCopy.verdict), className)}
      data-testid="pilot-roi-validation-handoff-card"
      aria-label="Pilot ROI validation handoff"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Pilot ROI validation handoff</p>
        <StatusTag kind={verdictStatusKind(verdictCopy.verdict)} label={verdictCopy.headline} />
      </div>

      <p className={cn("m-0 mt-2 leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{verdictCopy.detail}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusTag kind={roi.tier === "Strong" ? "ready" : roi.tier === "Low" ? "blocked" : "needs-attention"} label={`ROI confidence: ${roi.tier}`} />
        <StatusTag kind={dollarSafe ? "ready" : "blocked"} label={`Dollar claims sponsor-safe: ${dollarSafe ? "yes" : "no"}`} />
        <StatusTag kind="neutral" label={`Execution mode: ${executionMode}`} />
        {readiness !== null ? (
          <StatusTag
            kind={readiness.variant === "ready" ? "ready" : readiness.variant === "blocked" ? "blocked" : "needs-attention"}
            label={readiness.title}
          />
        ) : null}
      </div>

      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{roi.meaning}</p>

      {!buyerPolishedShell ? (
        <p className={cn("m-0 mt-2 font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Review ID: {runId}</p>
      ) : null}

      <CollapsibleSection title="Run validation interview (15 min)" defaultOpen={false}>
        <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {PILOT_ROI_VALIDATION_INTERVIEW_QUESTIONS.map((question) => (
            <li key={question.ledgerField}>
              {question.prompt}
              <span className={cn("block text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Ledger: {question.ledgerField}
              </span>
            </li>
          ))}
        </ol>
      </CollapsibleSection>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant="secondary" onClick={() => void onCopyChecklist()}>
          {copyState === "copied" ? "Copied checklist" : "Copy validation notes"}
        </Button>
        {copyState === "failed" ? (
          <span className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            Clipboard unavailable — copy manually from the runbook.
          </span>
        ) : null}
        <Link href={firstRunHelpHref} className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
          First-run help
        </Link>
        <a
          href={validationSessionHref}
          className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}
          rel="noopener noreferrer"
          target="_blank"
        >
          Validation session runbook
        </a>
      </div>
    </section>
  );
}

export type PilotRoiValidationHandoffClientProps = {
  readonly runId: string;
  readonly curatedSampleRun?: boolean;
  readonly className?: string;
};

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ok"; readonly payload: PilotRunDeltasProofSummaryJson | null };

/** Fetches pilot-run-deltas once and renders {@link PilotRoiValidationHandoffCard}. */
export function PilotRoiValidationHandoffClient(props: PilotRoiValidationHandoffClientProps) {
  const { runId, curatedSampleRun = false, className } = props;
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let canceled = false;

    async function load(): Promise<void> {
      setLoadState({ status: "loading" });

      const headers = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const url = `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/pilot-run-deltas`;

      try {
        const response = await fetch(url, headers);

        if (!response.ok) {
          if (!canceled) setLoadState({ status: "error" });

          return;
        }

        const payload = (await response.json()) as PilotRunDeltasProofSummaryJson;

        if (!canceled) setLoadState({ status: "ok", payload });
      } catch {
        if (!canceled) setLoadState({ status: "error" });
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, [runId]);

  if (loadState.status === "loading") {
    return (
      <div
        className={cn("rounded-md border border-neutral-200 p-4 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body, className)}
        role="status"
        aria-live="polite"
        data-testid="pilot-roi-validation-handoff-loading"
      >
        Loading ROI validation signals…
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className={className} data-testid="pilot-roi-validation-handoff-error">
        <OperatorApiProblem
          problem={null}
          fallbackMessage="Could not load pilot ROI validation signals for this review."
        />
      </div>
    );
  }

  return (
    <PilotRoiValidationHandoffCard
      runId={runId}
      payload={loadState.payload}
      curatedSampleRun={curatedSampleRun}
      className={className}
    />
  );
}
