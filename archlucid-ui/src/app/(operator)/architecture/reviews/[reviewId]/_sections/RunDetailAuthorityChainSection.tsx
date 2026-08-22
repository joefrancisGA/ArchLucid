"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import type { RunDetail } from "@/types/authority";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailAuthorityChainSectionProps = {
  readonly run: RunDetail["run"];
  readonly manifestId: string | null | undefined;
};

/** Full-operator review trail: manifest link + collapsible audit identifiers. */
export function RunDetailAuthorityChainSection(props: RunDetailAuthorityChainSectionProps): ReactElement {
  const { run, manifestId } = props;
  const { vocabulary } = useGovernanceMode();
  const manifestLabel = vocabulary.goldenManifestLabel;
  const rowLabelClass = cn("shrink-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body);
  const monoCodeClass = cn("truncate font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro);
  const manifestIdTrimmed = (manifestId ?? "").trim();
  const signedRecordSecondaryViewPresentation =
    manifestIdTrimmed.length > 0
      ? buildCanonicalObjectSecondaryView("sealedReviewRecord", "reviewPackageAuthorityChain", {
          manifestId: manifestIdTrimmed,
        })
      : null;

  return (
    <section id="authority-chain" className="scroll-mt-24">
      <Card>
        {signedRecordSecondaryViewPresentation !== null ? (
          <div className="px-6 pt-6">
            <CanonicalObjectSecondaryViewStrip
              presentation={signedRecordSecondaryViewPresentation}
              testId="review-authority-secondary-view-strip"
            />
          </div>
        ) : null}
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>{vocabulary.authorityChainLabel}</h3>
          <CardDescription>
            The {manifestLabel.toLowerCase()} anchors the authoritative decision. Recent pipeline milestones summarize how
            snapshots converged toward finalization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <GlossaryTooltip termKey="golden_manifest">{manifestLabel}</GlossaryTooltip>
            </p>
            <div className="mt-2 min-w-0">
              {manifestId ? (
                <Link
                  className={cn("inline-block font-semibold", OPERATOR_LINK.nav)}
                  href={signedRecordDetailPath(manifestId)}
                >
                  Finalized review record
                </Link>
              ) : (
                <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>—</span>
              )}
            </div>
          </div>

          <CollapsibleSection title="Audit identifiers" defaultOpen={false}>
            <ol className="m-0 list-none space-y-0 divide-y divide-neutral-200 p-0 dark:divide-neutral-800">
              {manifestId ? (
                <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className={rowLabelClass}>
                    Review record id
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-end">
                    <code className={monoCodeClass}>{manifestId}</code>
                    <CopyIdButton value={manifestId} aria-label="Copy review record ID" />
                  </span>
                </li>
              ) : null}
              <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <span className={rowLabelClass}>
                  <GlossaryTooltip termKey="context_snapshot">Context snapshot</GlossaryTooltip>
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-end">
                  <code className={monoCodeClass}>
                    {run.contextSnapshotId ?? " — "}
                  </code>
                  {run.contextSnapshotId ? (
                    <CopyIdButton value={run.contextSnapshotId} aria-label="Copy context snapshot ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className={rowLabelClass}>Graph snapshot</span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className={monoCodeClass}>
                    {run.graphSnapshotId ?? " — "}
                  </code>
                  {run.graphSnapshotId ? (
                    <CopyIdButton value={run.graphSnapshotId} aria-label="Copy graph snapshot ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className={rowLabelClass}>Findings snapshot</span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className={monoCodeClass}>
                    {run.findingsSnapshotId ?? " — "}
                  </code>
                  {run.findingsSnapshotId ? (
                    <CopyIdButton value={run.findingsSnapshotId} aria-label="Copy findings snapshot ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className={rowLabelClass}>
                  <GlossaryTooltip termKey="decision_trace">Decision trace</GlossaryTooltip>
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className={monoCodeClass}>
                    {run.decisionTraceId ?? " — "}
                  </code>
                  {run.decisionTraceId ? (
                    <CopyIdButton value={run.decisionTraceId} aria-label="Copy decision trace ID" />
                  ) : null}
                </span>
              </li>
              <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className={rowLabelClass}>
                  <GlossaryTooltip termKey="artifact_bundle">Artifact bundle</GlossaryTooltip>
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <code className={monoCodeClass}>
                    {run.artifactBundleId ?? " — "}
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
