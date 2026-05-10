"use client";

import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import { HelpLink } from "@/components/HelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { HelpButton } from "@/components/ui/help-button";
import { Badge } from "@/components/ui/badge";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import type { RunSummary } from "@/types/authority";

export type RunDetailPageHeaderProps = {
  runSummary: RunSummary;
  runId: string;
  headline: string;
  hasGoldenManifest: boolean;
  executionFlavorBuyerSummary?: string | null;
};

/**
 * Flagship run detail header: title, pipeline {@link RunStatusBadge}, metadata row, primary finalize action.
 * Compare / Replay stay in the Actions section per shell layout rules.
 */
export function RunDetailPageHeader({
  runSummary,
  runId,
  headline,
  hasGoldenManifest,
  executionFlavorBuyerSummary,
}: RunDetailPageHeaderProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showExecutionFlavorOperator =
    Boolean(executionFlavorBuyerSummary) && !buyerPolishedShell;

  return (
    <header className="mb-6 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="m-0 flex-1 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
              {headline}
            </h1>
            <div className="flex shrink-0 items-center gap-1.5">
              <HelpButton pageKey="/runs/[id]" />
              <HelpLink
                docPath="/docs/CORE_PILOT.md"
                label="Architecture review steps — Core Pilot guide on GitHub (new tab)"
              />
            </div>
          </div>
          {buyerPolishedShell && executionFlavorBuyerSummary ? (
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              <Badge variant="secondary" className="me-2 align-middle font-normal">
                Sample review package
              </Badge>
              {executionFlavorBuyerSummary}{" "}
              <Link
                href={`/reviews/${encodeURIComponent(runId)}#trust-evidence`}
                className="font-medium text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-neutral-600"
              >
                Traceable evidence and audit-ready history
              </Link>
            </p>
          ) : null}
          {showExecutionFlavorOperator ? (
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {executionFlavorBuyerSummary}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <RunStatusBadge run={runSummary} />
            {runSummary.runDegradedExecution ? (
              <Badge
                variant="outline"
                className="font-normal text-amber-900 dark:text-amber-200"
                title={
                  runSummary.degradedExecutionAgents?.length
                    ? `Resource-level LLM fallback on: ${runSummary.degradedExecutionAgents.join(", ")}`
                    : "Run used simulator substitution and/or degraded LLM execution path."
                }
              >
                Degraded execution
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Finalize
            <ContextualHelp helpKey="commit-manifest" />
          </p>
          <CommitRunButton runId={runId} disabled={hasGoldenManifest} />
          <p className="m-0 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="whitespace-nowrap">
              {buyerPolishedShell ? "Governance approval" : "Governance gate"}
            </span>
            <ContextualHelp helpKey="governance-gate" placement="left" />
          </p>
        </div>
      </div>
    </header>
  );
}
