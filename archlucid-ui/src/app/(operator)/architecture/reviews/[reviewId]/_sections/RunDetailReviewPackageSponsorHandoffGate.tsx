"use client";

import { Suspense, useEffect, useState } from "react";

import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import type { ManifestSummary, RunSummary, RunTrustEvidenceCard } from "@/types/authority";

import { GoldenSponsorPackageWalkthroughDestinationDeferred } from "./run-detail-page-view-deferred-chunks";
import { ReviewPackageSponsorHandoffStrip } from "./ReviewPackageSponsorHandoffStrip";
import type { ResolveReviewPackagePrimaryActionInput } from "./resolve-review-package-primary-action";

export type RunDetailReviewPackageSponsorHandoffGateProps = ResolveReviewPackagePrimaryActionInput & {
  readonly manifestId: string;
  readonly goldenManifestJsonForExport: unknown | null;
  readonly manifestSummary: ManifestSummary | null;
  readonly trustEvidenceCard: RunTrustEvidenceCard | null | undefined;
  readonly usedStaticDemoRun: boolean;
  readonly showExtendedSponsorBriefing: boolean;
  readonly lowExtractionConfidenceCount?: number;
  readonly enginesSucceeded?: number | null;
  readonly progressSummary?: RunSummary | null;
  readonly graphSnapshot?: unknown;
  readonly findingsSnapshot?: unknown;
};

/** Renders sponsor handoff only when the deferred primary-action resolver picks send-to-sponsor. */
export function RunDetailReviewPackageSponsorHandoffGate(
  props: RunDetailReviewPackageSponsorHandoffGateProps,
): React.JSX.Element | null {
  const [showSponsorHandoff, setShowSponsorHandoff] = useState<boolean | null>(null);

  useEffect(() => {
    let canceled = false;

    void import("./resolve-review-package-primary-action").then(({ resolveReviewPackagePrimaryAction }) => {
      if (canceled) {
        return;
      }

      const action = resolveReviewPackagePrimaryAction({
        runId: props.runId,
        manifestId: props.manifestId,
        hasCommitBlockingFailures: props.hasCommitBlockingFailures,
        blockingFindingCount: props.blockingFindingCount,
        buyerPolishedArtifactTable: props.buyerPolishedArtifactTable,
        operatorGovernanceDecision: props.operatorGovernanceDecision,
        manifestStatus: props.manifestStatus,
        runCompleted: props.runCompleted,
        nextAction: props.nextAction,
      });

      setShowSponsorHandoff(action.kind === "send-to-sponsor");
    });

    return () => {
      canceled = true;
    };
  }, [
    props.runId,
    props.manifestId,
    props.hasCommitBlockingFailures,
    props.blockingFindingCount,
    props.buyerPolishedArtifactTable,
    props.operatorGovernanceDecision,
    props.manifestStatus,
    props.runCompleted,
    props.nextAction,
  ]);

  if (showSponsorHandoff !== true) {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <GoldenSponsorPackageWalkthroughDestinationDeferred
          showSampleWalkthroughDestination={
            props.usedStaticDemoRun || isShowcaseStaticDemoRunId(props.runId)
          }
        />
      </Suspense>
      <ReviewPackageSponsorHandoffStrip
        runId={props.runId}
        manifestId={props.manifestId}
        goldenManifestJsonForExport={props.goldenManifestJsonForExport}
        manifestSummary={props.manifestSummary}
        trustEvidenceCard={props.trustEvidenceCard}
        usedStaticDemoRun={props.usedStaticDemoRun}
        showExtendedSponsorBriefing={props.showExtendedSponsorBriefing}
        lowExtractionConfidenceCount={props.lowExtractionConfidenceCount ?? 0}
        enginesSucceeded={props.enginesSucceeded ?? null}
        progressSummary={props.progressSummary ?? null}
        graphSnapshot={props.graphSnapshot ?? null}
        findingsSnapshot={props.findingsSnapshot ?? null}
      />
    </>
  );
}
