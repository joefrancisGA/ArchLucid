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
  /**
   * Buyer-polished finalized runs: aligns header governance hint with downstream summary tiles
   * (e.g., `Governance approval: Passed`).
   */
  buyerGovernanceLine?: string | null;
};

/**
 * Run detail header: title, derived pipeline cues, finalize affordance (operators), buyer read-only finalization cues.
 */
export function RunDetailPageHeader({
  runSummary,
  runId,
  headline,
  hasGoldenManifest,
  executionFlavorBuyerSummary,
  buyerGovernanceLine,
}: RunDetailPageHeaderProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const finalizedBuyerChrome = buyerPolishedShell === true && hasGoldenManifest === true;
  const showExecutionFlavorOperator =
    Boolean(executionFlavorBuyerSummary) && buyerPolishedShell !== true;

  return (
    <header className="mb-6 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <h1 className="m-0 min-w-0 flex-1 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                {headline}
              </h1>
              {buyerPolishedShell === true && finalizedBuyerChrome === true ? (
                <RunStatusBadge run={runSummary} />
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <HelpButton pageKey="/runs/[id]" />
              <HelpLink
                docPath="/docs/CORE_PILOT.md"
                label="Architecture review steps — Core Pilot guide on GitHub (new tab)"
              />
            </div>
          </div>
          {buyerPolishedShell === true && executionFlavorBuyerSummary ? (
            <>
              <p className="m-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {executionFlavorBuyerSummary}
              </p>
              <p className="m-0 mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                In production, workflows and evidence sources follow your tenant configuration.
              </p>
              <p className="m-0 mt-2 inline-flex max-w-3xl flex-wrap items-center gap-2 rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm font-medium text-teal-950 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100">
                <span>Traceable evidence and audit-ready history</span>
                <Link
                  href={`/reviews/${encodeURIComponent(runId)}#trust-evidence`}
                  className="text-sm font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-50"
                >
                  View evidence basis
                </Link>
              </p>
            </>
          ) : null}
          {showExecutionFlavorOperator ? (
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {executionFlavorBuyerSummary}
            </p>
          ) : null}
          {runSummary.runDegradedExecution === true ||
          !(buyerPolishedShell === true && finalizedBuyerChrome === true) ? (
            <div className="flex flex-wrap items-center gap-2">
              {!(buyerPolishedShell === true && finalizedBuyerChrome === true) ? (
                <RunStatusBadge run={runSummary} />
              ) : null}
              {runSummary.runDegradedExecution === true ? (
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
          ) : null}
        </div>
        {buyerPolishedShell === true ? (
          finalizedBuyerChrome === true ? (
            <div className="flex shrink-0 flex-col gap-2 text-right">
              {buyerGovernanceLine !== null && buyerGovernanceLine !== undefined && buyerGovernanceLine.length > 0 ? (
                <p className="m-0 text-sm font-semibold leading-snug text-teal-900 dark:text-teal-200">
                  {buyerGovernanceLine}
                </p>
              ) : (
                <p className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-50">Finalized package</p>
              )}
            </div>
          ) : (
            <div className="flex shrink-0 flex-col gap-1.5">
              <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Finalize package
                <ContextualHelp helpKey="commit-manifest" />
              </p>
              <CommitRunButton runId={runId} disabled={hasGoldenManifest} />
              <p className="m-0 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="whitespace-nowrap">Governance approval</span>
                <ContextualHelp helpKey="governance-gate" placement="left" />
              </p>
            </div>
          )
        ) : (
          <div className="flex shrink-0 flex-col gap-1.5">
            <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Finalize
              <ContextualHelp helpKey="commit-manifest" />
            </p>
            <CommitRunButton runId={runId} disabled={hasGoldenManifest} />
            <p className="m-0 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <span className="whitespace-nowrap">Governance gate</span>
              <ContextualHelp helpKey="governance-gate" placement="left" />
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
