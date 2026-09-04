"use client";

import type { ReactElement, ReactNode } from "react";
import { useMemo } from "react";

import { RunDetailEvidenceInventorySection } from "@/components/runs/RunDetailEvidenceInventorySection";
import { RunDetailEvidenceScopeHeader } from "@/components/runs/RunDetailEvidenceScopeHeader";
import { RunDetailSectionNav } from "@/components/runs/RunDetailSectionNav";
import { deriveRunTrustEvidenceReadinessFromCard } from "@/components/runs/RunTrustEvidenceCardSection";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { deriveEvidencePresenceFromInventoryKinds } from "@/lib/evidence-gap-forecast";
import type { RunDetailEvidenceInventoryItem } from "@/lib/runs/run-detail-evidence-inventory";
import {
  countRunDetailEvidenceInventoryItems,
  deriveEvidenceScopeCoverageLine,
  deriveEvidenceScopeReadiness,
} from "@/lib/runs/run-detail-evidence-inventory";

import {
  RunDetailAdvancedAnalysisSectionDeferred,
  RunDetailCaptureEvidenceSectionDeferred,
  RunDetailRetrievalGroundingSectionDeferred,
  RunDetailTrustEvidenceCardSectionDeferred,
} from "./run-detail-page-view-deferred-chunks";
import type { RunTrustEvidenceCard } from "@/types/authority";

type RunDetailEvidenceTabPanelProps = {
  readonly packageName: string;
  readonly reviewDateLabel: string;
  readonly evidenceItemCount: number;
  readonly deliverableCount: number;
  readonly evidenceCoverageSummaryLine: string;
  readonly linkedFindingCount: number;
  readonly openFindingCount: number;
  readonly items: readonly RunDetailEvidenceInventoryItem[];
  readonly runId: string;
  readonly manifestId: string | null | undefined;
  readonly buyerPolished: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly trustEvidenceCard: RunTrustEvidenceCard | null | undefined;
  readonly faithfulnessWarning: string | null;
  readonly artifactsExportsSection: ReactNode;
  readonly blockingFindingId: string | null;
  readonly blockingFindingTitle: string | null;
  readonly approvalBlocked: boolean;
  /** When ReviewPackageDoThisNextStrip owns the filled page primary (TB-2175). */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** Evidence tab body — deferred off sync First Load JS (TB-2142). */
export function RunDetailEvidenceTabPanel(props: RunDetailEvidenceTabPanelProps): ReactElement {
  const inventoryCount = countRunDetailEvidenceInventoryItems(props.items);
  const evalChromeShell = useProductionEvalChrome();
  const trustReadiness =
    props.trustEvidenceCard != null
      ? deriveRunTrustEvidenceReadinessFromCard(props.trustEvidenceCard, evalChromeShell)
      : null;
  const scopeReadiness = deriveEvidenceScopeReadiness({
    inventoryCount,
    trustReadiness,
  });
  const evidenceCoverageLine = deriveEvidenceScopeCoverageLine({
    inventoryCount,
    findingsCoverageSummaryLine: props.evidenceCoverageSummaryLine,
    linkedFindingCount: props.linkedFindingCount,
    openFindingCount: props.openFindingCount,
  });
  const hasManifest = Boolean((props.manifestId ?? "").trim().length > 0);
  const evidencePresence = deriveEvidencePresenceFromInventoryKinds({
    inventoryKinds: props.items.map((item) => item.kind),
    submittedArchitecturePresent: props.items.some((item) => item.key === "__architecture-brief__"),
  });
  const showTrustEvidence = hasManifest && props.trustEvidenceCard != null;
  const showAdvancedAnalysis = hasManifest;

  const sectionNavSections = useMemo(
    () => [
      { id: "submitted-evidence-inventory", label: "Submitted evidence", available: true },
      { id: "artifacts-exports", label: "Deliverables", available: hasManifest },
      { id: "trust-evidence", label: "Evidence basis", available: showTrustEvidence },
      { id: "advanced-analysis", label: "Advanced analysis", available: showAdvancedAnalysis },
    ],
    [hasManifest, showTrustEvidence, showAdvancedAnalysis],
  );

  return (
    <div className="space-y-4">
      <RunDetailSectionNav runId={props.runId} sections={sectionNavSections} />
      <RunDetailEvidenceScopeHeader
        packageName={props.packageName}
        reviewDateLabel={props.reviewDateLabel}
        evidenceItemCount={inventoryCount}
        deliverableCount={props.deliverableCount}
        readinessHeadline={scopeReadiness.headline}
        readinessVerdict={scopeReadiness.verdict}
        evidenceCoverageLine={evidenceCoverageLine}
      />
      <RunDetailEvidenceInventorySection
        items={props.items}
        hasManifest={hasManifest}
        pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
      />
      {!hasManifest ? (
        <RunDetailCaptureEvidenceSectionDeferred
          runId={props.runId}
          buyerPolished={props.buyerPolished}
          evidencePresence={evidencePresence}
        />
      ) : null}
      {showTrustEvidence ? (
        <RunDetailTrustEvidenceCardSectionDeferred
          card={props.trustEvidenceCard}
          runId={props.runId}
          evidenceAskRunId={props.buyerPolishedArtifactTable ? props.runId : null}
          blockingFindingId={props.blockingFindingId}
          blockingFindingTitle={props.blockingFindingTitle}
          approvalBlocked={props.approvalBlocked}
        />
      ) : null}
      {props.artifactsExportsSection}
      {!props.buyerPolishedArtifactTable && hasManifest ? (
        <RunDetailRetrievalGroundingSectionDeferred
          runId={props.runId}
          showWhenFaithfulnessWarning={
            typeof props.faithfulnessWarning === "string"
            && props.faithfulnessWarning.trim().length > 0
          }
        />
      ) : null}
      {showAdvancedAnalysis ? (
        <RunDetailAdvancedAnalysisSectionDeferred
          runId={props.runId}
          buyerPolishedArtifactTable={props.buyerPolishedArtifactTable}
        />
      ) : null}
    </div>
  );
}
