import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import { RunDetailEvidenceInventorySection } from "@/components/runs/RunDetailEvidenceInventorySection";
import { RunDetailEvidenceScopeHeader } from "@/components/runs/RunDetailEvidenceScopeHeader";
import { deriveEvidencePresenceFromInventoryKinds } from "@/lib/evidence-gap-forecast";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";
import {
  countRunDetailEvidenceInventoryItems,
  deriveEvidenceScopeCoverageLine,
  deriveEvidenceScopeReadiness,
} from "@/lib/runs/run-detail-evidence-inventory";
import { RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD } from "@/lib/runs/run-detail-create-home-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { RunDetailCreateHomeEvidenceCaptureRegion } from "./RunDetailCreateHomeEvidenceCaptureRegion";

export type RunDetailCreateHomeEvidencePanelProps = {
  readonly packageName: string;
  readonly reviewDateLabel: string;
  readonly deliverableCount: number;
  readonly evidenceCoverageSummaryLine: string;
  readonly linkedFindingCount: number;
  readonly openFindingCount: number;
  readonly items: readonly RunDetailEvidenceInventoryItem[];
  readonly artifacts: readonly { readonly artifactId: string; readonly name: string; readonly createdUtc: string }[];
  readonly runId: string;
  readonly buyerPolished: boolean;
};

/** Create-home Evidence archTab — inventory + capture (pre-finalization). */
export function RunDetailCreateHomeEvidencePanel(props: RunDetailCreateHomeEvidencePanelProps): ReactElement {
  const inventoryCount = countRunDetailEvidenceInventoryItems(props.items);
  const scopeReadiness = deriveEvidenceScopeReadiness({
    inventoryCount,
    trustReadiness: null,
  });
  const evidenceCoverageLine = deriveEvidenceScopeCoverageLine({
    inventoryCount,
    findingsCoverageSummaryLine: props.evidenceCoverageSummaryLine,
    linkedFindingCount: props.linkedFindingCount,
    openFindingCount: props.openFindingCount,
  });
  const evidencePresence = deriveEvidencePresenceFromInventoryKinds({
    inventoryKinds: props.items.map((item) => item.kind),
    submittedArchitecturePresent: props.items.some((item) => item.key === "__architecture-brief__"),
  });

  return (
    <div className="space-y-4" data-testid="run-detail-create-home-evidence">
      <div
        className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
        data-testid="run-detail-create-home-evidence-orientation"
      >
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD}
        </p>
      </div>
      <RunDetailEvidenceScopeHeader
        packageName={props.packageName}
        reviewDateLabel={props.reviewDateLabel}
        evidenceItemCount={inventoryCount}
        deliverableCount={props.deliverableCount}
        readinessHeadline={scopeReadiness.headline}
        readinessVerdict={scopeReadiness.verdict}
        evidenceCoverageLine={evidenceCoverageLine}
      />
      <EvidenceGapForecastPanel presence={evidencePresence} />
      <RunDetailEvidenceInventorySection items={props.items} hasManifest={false} />
      <RunDetailCreateHomeEvidenceCaptureRegion
        key={props.runId}
        runId={props.runId}
        buyerPolished={props.buyerPolished}
        artifacts={props.artifacts}
      />
    </div>
  );
}
