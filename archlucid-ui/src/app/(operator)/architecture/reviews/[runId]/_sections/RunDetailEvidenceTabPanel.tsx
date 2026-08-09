"use client";

import type { ReactElement, ReactNode } from "react";

import { RunDetailEvidenceInventorySection } from "@/components/RunDetailEvidenceInventorySection";
import { RunDetailEvidenceScopeHeader } from "@/components/RunDetailEvidenceScopeHeader";
import type { RunDetailEvidenceInventoryItem } from "@/lib/run-detail-evidence-inventory";

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
  readonly readinessHeadline: string;
  readonly readinessVerdict: "complete" | "gaps";
  readonly evidenceCoverageLine: string;
  readonly items: readonly RunDetailEvidenceInventoryItem[];
  readonly runId: string;
  readonly manifestId: string | null | undefined;
  readonly buyerPolished: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly trustEvidenceCard: RunTrustEvidenceCard | null | undefined;
  readonly faithfulnessWarning: string | null;
  readonly artifactsExportsSection: ReactNode;
};

/** Evidence tab body — deferred off sync First Load JS (TB-2142). */
export function RunDetailEvidenceTabPanel(props: RunDetailEvidenceTabPanelProps): ReactElement {
  return (
    <div className="space-y-4">
      <RunDetailEvidenceScopeHeader
        packageName={props.packageName}
        reviewDateLabel={props.reviewDateLabel}
        evidenceItemCount={props.evidenceItemCount}
        deliverableCount={props.deliverableCount}
        readinessHeadline={props.readinessHeadline}
        readinessVerdict={props.readinessVerdict}
        evidenceCoverageLine={props.evidenceCoverageLine}
      />
      <RunDetailEvidenceInventorySection items={props.items} />
      {!props.manifestId ? (
        <RunDetailCaptureEvidenceSectionDeferred
          runId={props.runId}
          buyerPolished={props.buyerPolished}
        />
      ) : null}
      {props.artifactsExportsSection}
      {props.manifestId && props.trustEvidenceCard ? (
        <RunDetailTrustEvidenceCardSectionDeferred
          card={props.trustEvidenceCard}
          runId={props.runId}
          evidenceAskRunId={props.buyerPolishedArtifactTable ? props.runId : null}
        />
      ) : null}
      {!props.buyerPolishedArtifactTable && props.manifestId ? (
        <RunDetailRetrievalGroundingSectionDeferred
          runId={props.runId}
          showWhenFaithfulnessWarning={
            typeof props.faithfulnessWarning === "string"
            && props.faithfulnessWarning.trim().length > 0
          }
        />
      ) : null}
      {props.manifestId ? (
        <RunDetailAdvancedAnalysisSectionDeferred
          runId={props.runId}
          buyerPolishedArtifactTable={props.buyerPolishedArtifactTable}
        />
      ) : null}
    </div>
  );
}
