"use client";

import Link from "next/link";

import { CommitRunButton } from "@/components/CommitRunButton";
import { HelpLink } from "@/components/HelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { HelpButton } from "@/components/ui/help-button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/StatusPill";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { StructuralExecutionModeBadge } from "@/components/StructuralExecutionModeBadge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RUN_PACKAGE_EXPORT_LABELS } from "@/lib/i18n";
import { runExecutiveSummaryExportHref } from "@/lib/api/run-summary-export-api";
import type { RunSummary } from "@/types/authority";

function runPackageExportHref(runId: string, format: "docx" | "pdf" | "html"): string {
  return `/api/proxy/v1/runs/${encodeURIComponent(runId)}/export/${format}`;
}

function RunPackageExportButtons({ runId }: { runId: string }) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={runPackageExportHref(runId, "docx")} prefetch={false} target="_blank">
          <Download className="mr-2 h-4 w-4" />
          {RUN_PACKAGE_EXPORT_LABELS.docx}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={runPackageExportHref(runId, "pdf")} prefetch={false} target="_blank">
          <Download className="mr-2 h-4 w-4" />
          {RUN_PACKAGE_EXPORT_LABELS.pdf}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={runPackageExportHref(runId, "html")} prefetch={false} target="_blank">
          <Download className="mr-2 h-4 w-4" />
          {RUN_PACKAGE_EXPORT_LABELS.html}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={runExecutiveSummaryExportHref(runId)} prefetch={false} target="_blank">
          <Download className="mr-2 h-4 w-4" />
          Download Executive Summary
        </Link>
      </Button>
    </div>
  );
}

export type RunDetailPageHeaderProps = {
  runSummary: RunSummary;
  runId: string;
  headline: string;
  hasGoldenManifest: boolean;
  executionFlavorBuyerSummary?: string | null;
  /**
   * Buyer-polished: governance gate label mapped for display (for example Passed → Approved with monitoring).
   */
  buyerGovernanceApprovalLabel?: string | null;
  /** Buyer-polished: one sentence beside the finalized pipeline pill. */
  buyerHeaderStatusCaption?: string | null;
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
  buyerGovernanceApprovalLabel,
  buyerHeaderStatusCaption,
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
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <h1 className="m-0 min-w-0 flex-1 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl flex items-center">
                  {headline}
                  {runSummary.idempotencyReplayed ? (
                    <Badge variant="secondary" className="ml-2 font-normal">Replayed</Badge>
                  ) : null}
                </h1>
                {buyerPolishedShell === true && finalizedBuyerChrome === true ? (
                  <RunStatusBadge run={runSummary} />
                ) : null}
              </div>
              {buyerPolishedShell === true && finalizedBuyerChrome === true && buyerHeaderStatusCaption ? (
                <p className="m-0 max-w-3xl text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                  {buyerHeaderStatusCaption}
                </p>
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
                      : "This architecture review used simulator substitution and/or a degraded LLM execution path."
                  }
                >
                  Degraded execution
                </Badge>
              ) : null}
              {buyerPolishedShell !== true ? (
                <StructuralExecutionModeBadge structuralExecutionMode={runSummary.structuralExecutionMode} />
              ) : null}
            </div>
          ) : null}
        </div>
        {buyerPolishedShell === true ? (
          finalizedBuyerChrome === true ? (
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              {buyerGovernanceApprovalLabel !== null &&
              buyerGovernanceApprovalLabel !== undefined &&
              buyerGovernanceApprovalLabel.trim().length > 0 ? (
                <div className="flex flex-col items-end gap-1">
                  <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    Governance approval
                  </p>
                  <StatusPill
                    status={buyerGovernanceApprovalLabel.trim()}
                    domain="governance"
                    uppercase={false}
                    className="text-xs font-semibold normal-case tracking-normal"
                  />
                </div>
              ) : (
                <p className="m-0 text-sm font-semibold text-neutral-950 dark:text-neutral-50">Finalized package</p>
              )}
              {hasGoldenManifest ? <RunPackageExportButtons runId={runId} /> : null}
            </div>
          ) : (
            <div className="flex shrink-0 flex-col gap-1.5">
              <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Finalize package
                <ContextualHelp helpKey="commit-manifest" />
              </p>
              <CommitRunButton runId={runId} disabled={hasGoldenManifest} />
              {hasGoldenManifest ? <RunPackageExportButtons runId={runId} /> : null}
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
            {hasGoldenManifest ? <RunPackageExportButtons runId={runId} /> : null}
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
