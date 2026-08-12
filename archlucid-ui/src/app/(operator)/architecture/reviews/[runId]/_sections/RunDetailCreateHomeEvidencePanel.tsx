import type { ReactElement } from "react";

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

import { RunDetailCaptureEvidenceSectionDeferred } from "./run-detail-page-view-deferred-chunks";

export type RunDetailCreateHomeEvidencePanelProps = {
  readonly packageName: string;
  readonly reviewDateLabel: string;
  readonly deliverableCount: number;
  readonly evidenceCoverageSummaryLine: string;
  readonly linkedFindingCount: number;
  readonly openFindingCount: number;
  readonly items: readonly RunDetailEvidenceInventoryItem[];
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
      <RunDetailCaptureEvidenceSectionDeferred runId={props.runId} buyerPolished={props.buyerPolished} />
    </div>
  );
}
