"use client";

import { CommitRunButton } from "@/components/CommitRunButton";
import { HelpLink } from "@/components/HelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
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
  return (
    <header className="mb-6 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="m-0 flex-1 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
              {headline}
            </h1>
            <HelpLink
              docPath="/docs/CORE_PILOT.md"
              label="Architecture review steps — Core Pilot guide on GitHub (new tab)"
            />
          </div>
          {executionFlavorBuyerSummary ? (
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {executionFlavorBuyerSummary}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <RunStatusBadge run={runSummary} />
          </div>
        </div>
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
      </div>
    </header>
  );
}
