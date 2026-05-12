import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { RunDetail } from "@/types/authority";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailAuthorityChainSectionProps = {
  readonly run: RunDetail["run"];
  readonly manifestId: string | null | undefined;
};

/** Full-operator review trail: manifest link + collapsible audit identifiers. */
export function RunDetailAuthorityChainSection(props: RunDetailAuthorityChainSectionProps): ReactElement {
  const { run, manifestId } = props;

  return (
    <section id="authority-chain" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Review trail</h3>
          <CardDescription>
            The reviewed manifest anchors the authoritative record. Recent pipeline milestones summarize how snapshots
            converged toward finalization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
              <GlossaryTooltip termKey="golden_manifest">Reviewed manifest</GlossaryTooltip>
            </p>
            <div className="mt-2 min-w-0">
              {manifestId ? (
                <Link
                  className="inline-block text-sm font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                  href={`/manifests/${encodeURIComponent(manifestId)}`}
                >
                  Finalized Architecture Manifest
                </Link>
              ) : (
                <span className="font-mono text-xs">—</span>
              )}
            </div>
          </div>

          <CollapsibleSection title="Audit identifiers" defaultOpen={false}>
            <ol className="m-0 list-none space-y-0 divide-y divide-neutral-200 p-0 dark:divide-neutral-800">
              {manifestId ? (
                <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Reviewed manifest id
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-end">
                    <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">{manifestId}</code>
                    <CopyIdButton value={manifestId} aria-label="Copy reviewed manifest ID" />
                  </span>
                </li>
              ) : null}
              <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <GlossaryTooltip termKey="context_snapshot">Context snapshot</GlossaryTooltip>
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-end">
                  <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {run.contextSnapshotId ?? "—"}
                  </code>
                  {run.contextSnapshotId ? (
                    <CopyIdButton value={run.contextSnapshotId} aria-label="Copy context snapshot ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">Graph snapshot</span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {run.graphSnapshotId ?? "—"}
                  </code>
                  {run.graphSnapshotId ? (
                    <CopyIdButton value={run.graphSnapshotId} aria-label="Copy graph snapshot ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">Findings snapshot</span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {run.findingsSnapshotId ?? "—"}
                  </code>
                  {run.findingsSnapshotId ? (
                    <CopyIdButton value={run.findingsSnapshotId} aria-label="Copy findings snapshot ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <GlossaryTooltip termKey="decision_trace">Decision trace</GlossaryTooltip>
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {run.decisionTraceId ?? "—"}
                  </code>
                  {run.decisionTraceId ? (
                    <CopyIdButton value={run.decisionTraceId} aria-label="Copy decision trace ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="shrink-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <GlossaryTooltip termKey="artifact_bundle">Artifact bundle</GlossaryTooltip>
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className="truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {run.artifactBundleId ?? "—"}
                  </code>
                  {run.artifactBundleId ? (
                    <CopyIdButton value={run.artifactBundleId} aria-label="Copy artifact bundle ID" />
                  ) : null}
                </span>
              </li>
            </ol>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
