"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
import {
  GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE,
} from "@/lib/governance/governance-mutation-outcome-copy";
import { recordBulkFindingDisposition, type FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { listOpenRootCauseClusters } from "@/lib/review-quality/compare-quality-delta";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  DISPOSITION_RATIONALE_MIN_CHARS,
} from "@/lib/review-quality/finding-governance-gates";

type ClusterDisposition = Extract<FindingDispositionKind, "Accepted" | "RejectedAsNotApplicable">;

const CLUSTER_DISPOSITION_LABELS: Record<ClusterDisposition, string> = {
  Accepted: "Accept cluster",
  RejectedAsNotApplicable: "Waive cluster",
};

export type RootCauseClusterDispositionStripProps = {
  readonly findings: readonly QuickDecisionFinding[];
};

/** TB-2326: one disposition action per root-cause cluster before triage. */
export function RootCauseClusterDispositionStrip(
  props: RootCauseClusterDispositionStripProps,
): React.JSX.Element | null {
  const clusters = listOpenRootCauseClusters(props.findings);
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [inlineErrorMessage, setInlineErrorMessage] = useState<string | null>(null);
  const [pendingClusterKey, setPendingClusterKey] = useState<string | null>(null);
  const [pendingDisposition, setPendingDisposition] = useState<ClusterDisposition | null>(null);

  if (clusters.length === 0) {
    return null;
  }

  const trimmedReason = reason.trim();
  const reasonReady = trimmedReason.length >= DISPOSITION_RATIONALE_MIN_CHARS;
  const pendingCluster = clusters.find((cluster) => cluster.key === pendingClusterKey) ?? null;

  function requestClusterDisposition(clusterKey: string, disposition: ClusterDisposition): void {
    if (!reasonReady) {
      return;
    }

    setInlineErrorMessage(null);
    setPendingClusterKey(clusterKey);
    setPendingDisposition(disposition);
  }

  async function applyClusterDisposition(): Promise<void> {
    if (pendingCluster === null || pendingDisposition === null || !reasonReady) {
      return;
    }

    setBusy(true);
    setInlineErrorMessage(null);

    const idempotencyKey = createGovernanceMutationIdempotencyKey();

    try {
      const result = await recordBulkFindingDisposition(
        {
          findingIds: [...pendingCluster.findingIds],
          disposition: pendingDisposition,
          rationale: trimmedReason,
        },
        { idempotencyKey },
      );

      if (result.processedCount <= 0) {
        setInlineErrorMessage(GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
        return;
      }

      setPendingClusterKey(null);
      setPendingDisposition(null);
      router.refresh();
    } catch {
      setInlineErrorMessage(GOVERNANCE_BULK_DISPOSITION_FAILURE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="root-cause-cluster-disposition-strip"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Root-cause clusters — apply one disposition per related group
      </p>
      <div className="mt-2 space-y-2">
        <Label htmlFor="root-cause-cluster-rationale" className={OPERATOR_TYPOGRAPHY.helper}>
          Shared rationale (required for accept or waive)
        </Label>
        <Input
          id="root-cause-cluster-rationale"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
          placeholder="Why this pattern is accepted or not applicable"
          className="h-9"
          data-testid="root-cause-cluster-rationale"
        />
      </div>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {clusters.slice(0, 4).map((cluster) => (
          <li
            key={cluster.key}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
          >
            <span className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {cluster.label}{" "}
              <span className="text-al-text-secondary">({cluster.openCount} open)</span>
            </span>
            <span className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || !reasonReady}
                onClick={() => {
                  requestClusterDisposition(cluster.key, "Accepted");
                }}
                data-testid={`root-cause-cluster-accept-${cluster.key}`}
              >
                {CLUSTER_DISPOSITION_LABELS.Accepted}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || !reasonReady}
                onClick={() => {
                  requestClusterDisposition(cluster.key, "RejectedAsNotApplicable");
                }}
                data-testid={`root-cause-cluster-waive-${cluster.key}`}
              >
                {CLUSTER_DISPOSITION_LABELS.RejectedAsNotApplicable}
              </Button>
            </span>
          </li>
        ))}
      </ul>
      {inlineErrorMessage !== null ? (
        <OperatorMutationInlineError className="mt-2" message={inlineErrorMessage} />
      ) : null}
      <ConfirmationDialog
        open={pendingCluster !== null && pendingDisposition !== null}
        title={
          pendingDisposition !== null && pendingCluster !== null
            ? `${CLUSTER_DISPOSITION_LABELS[pendingDisposition]} (${pendingCluster.openCount} findings)`
            : "Apply cluster disposition"
        }
        description={
          pendingCluster !== null
            ? `This records the same disposition for ${pendingCluster.openCount} related findings in "${pendingCluster.label}".`
            : ""
        }
        confirmLabel={
          pendingDisposition !== null ? CLUSTER_DISPOSITION_LABELS[pendingDisposition] : "Confirm"
        }
        confirmDisabled={busy || !reasonReady}
        onConfirm={() => {
          void applyClusterDisposition();
        }}
        onOpenChange={(open) => {
          // Dismissal clears the pending selection; an in-flight apply keeps it so the strip still
          // knows which cluster the mutation belongs to when it reports back.
          if (!open && !busy) {
            setPendingClusterKey(null);
            setPendingDisposition(null);
          }
        }}
      />
    </section>
  );
}
