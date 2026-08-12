"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  dispositionLabel,
  type OperatorAiQualitySnapshot,
  type OperatorAiQualitySnapshotDisposition,
} from "@/lib/operator/operator-ai-quality-snapshot";

function formatMetric(value: number | null | undefined, digits: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(digits);
}

function dispositionStatusKind(disposition: OperatorAiQualitySnapshotDisposition): EnterpriseStatusKind {
  switch (disposition) {
    case "PASS":
      return "ready";
    case "WARN":
      return "needs-attention";
    case "NOT_GENERATED":
      return "draft";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

/** Dashboard tile: offline retrieval + quality snapshot metrics for operators. */
export type QualityGateMetricsTileProps = {
  readonly surface?: "operator" | "executive";
};

export function QualityGateMetricsTile({ surface = "operator" }: QualityGateMetricsTileProps): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<OperatorAiQualitySnapshot | null>(null);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        const response = await fetch("/operator-ai-quality-snapshot.json", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as OperatorAiQualitySnapshot;

        if (!canceled) {
          setSnapshot(json);
        }
      }
      catch {
        /* optional snapshot */
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const recall = snapshot?.retrievalIr.meanRecallAt5 ?? null;
  const mrr = snapshot?.retrievalIr.meanMrr ?? null;
  const executiveSurface = surface === "executive";

  return (
    <Card data-testid="quality-gate-metrics-tile">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
            {executiveSurface ? "Evidence retrieval quality" : "AI quality metrics"}
          </h2>
          {snapshot !== null ? (
            <StatusTag kind={dispositionStatusKind(snapshot.disposition)} label={dispositionLabel(snapshot.disposition)} />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            {executiveSurface ? "Retrieval accuracy (top results)" : "Mean recall@5 (golden cohort)"}
          </p>
          <p className="m-0 font-mono text-lg text-neutral-900 dark:text-neutral-100">{formatMetric(recall, 4)}</p>
        </div>
        <div>
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            {executiveSurface ? "Rank quality" : "Mean MRR"}
          </p>
          <p className="m-0 font-mono text-lg text-neutral-900 dark:text-neutral-100">{formatMetric(mrr, 4)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
