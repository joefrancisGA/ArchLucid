"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { LearningProfile } from "@/types/recommendation-learning";
import type { RecommendationLearningOperationalStatus } from "@/types/recommendation-learning-operational";
import type { ReactNode } from "react";

import {
  RecommendationLearningFieldRow,
  RecommendationLearningWeightTable,
} from "./RecommendationLearningWeightTable";
import {
  formatOperationalTimestamp,
  profileStateLabel,
  profileStateStatusTagKind,
} from "./recommendation-learning-ops-display";

type Props = {
  readonly status: RecommendationLearningOperationalStatus;
  readonly profile: LearningProfile | null;
  readonly canMutate: boolean;
  readonly onRefresh: () => void;
  readonly onPreview: () => void;
  readonly onRebuild: () => void;
  readonly previewPanel?: ReactNode;
};

export function RecommendationLearningOpsStatusPanel(props: Props) {
  const { canMutate, onPreview, onRebuild, onRefresh, previewPanel, profile, status } = props;
  const insufficient = status.profileState === "InsufficientData";

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className={OPERATOR_LAYOUT.sectionStack}>
        <article className="rounded-lg border border-al-border/70 p-4">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Profile state</h2>
          <dl className="m-0">
            <div className="grid grid-cols-1 gap-1 border-b border-al-border/60 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Profile state</dt>
              <dd className="m-0" data-testid="rl-profile-state">
                <StatusTag
                  kind={profileStateStatusTagKind(status.profileState)}
                  label={profileStateLabel(status.profileState)}
                />
              </dd>
            </div>
            <RecommendationLearningFieldRow label="Scope" value={status.scopeLabel} />
            <RecommendationLearningFieldRow label="Eligible outcomes" value={String(status.eligibleOutcomeCount)} />
            <RecommendationLearningFieldRow label="Minimum required outcomes" value={String(status.minimumRequiredOutcomes)} />
            <RecommendationLearningFieldRow label="Oldest eligible outcome" value={formatOperationalTimestamp(status.oldestEligibleOutcomeUtc)} />
            <RecommendationLearningFieldRow label="Newest eligible outcome" value={formatOperationalTimestamp(status.newestEligibleOutcomeUtc)} />
            <RecommendationLearningFieldRow label="Last attempted build" value={formatOperationalTimestamp(status.lastAttemptedBuildUtc)} />
            <RecommendationLearningFieldRow label="Last build result" value={status.lastBuildResult ?? "Never"} />
            <RecommendationLearningFieldRow label="Blocking reason" value={status.blockingReason ?? " — "} />
          </dl>
          {insufficient ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/architecture/reviews" className="text-al-accent underline-offset-2 hover:underline">
                Open completed reviews
              </Link>
              <Button type="button" variant="outline" size="sm" onClick={() => void onRefresh()}>
                Refresh operational data
              </Button>
            </div>
          ) : null}
          {!insufficient && status.profileState === "NotBuilt" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="outline" size="sm" disabled={!canMutate} onClick={() => void onPreview()}>
                Preview first build
              </Button>
              <Button type="button" size="sm" disabled={!canMutate} onClick={() => void onRebuild()}>
                Build first candidate profile
              </Button>
            </div>
          ) : null}
        </article>

        {status.activeProfile ? (
          <article className="rounded-lg border border-al-border/70 p-4">
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Current profile metadata</h2>
            <dl className="m-0">
              <RecommendationLearningFieldRow label="Profile ID" value={status.activeProfile.profileId} copyable />
              <RecommendationLearningFieldRow label="Generated at" value={formatOperationalTimestamp(status.activeProfile.generatedUtc)} />
              <RecommendationLearningFieldRow label="Status" value={status.activeProfile.status} />
              <RecommendationLearningFieldRow label="Algorithm version" value={status.activeProfile.algorithmVersion} />
              <RecommendationLearningFieldRow label="Feature-schema version" value={status.activeProfile.featureSchemaVersion} />
              <RecommendationLearningFieldRow label="Outcome count" value={String(status.activeProfile.outcomeCount)} />
              <RecommendationLearningFieldRow label="Eligible outcome count" value={String(status.activeProfile.eligibleOutcomeCount)} />
              <RecommendationLearningFieldRow label="Excluded outcome count" value={String(status.activeProfile.excludedOutcomeCount)} />
              <RecommendationLearningFieldRow label="Build source" value={status.activeProfile.buildSource} />
              <RecommendationLearningFieldRow label="Last activated at" value={formatOperationalTimestamp(status.activeProfile.lastActivatedUtc)} />
              <RecommendationLearningFieldRow label="Profile checksum" value={status.activeProfile.profileChecksum} copyable />
              <RecommendationLearningFieldRow label="Storage location" value={status.activeProfile.storageLocation} />
              <RecommendationLearningFieldRow label="Last validation result" value={status.activeProfile.lastValidationResult ?? " — "} />
            </dl>
          </article>
        ) : null}

        {profile ? (
          <article className="rounded-lg border border-al-border/70 p-4">
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Weighting details</h2>
            <details open>
              <summary className="cursor-pointer">Active profile weights</summary>
              <RecommendationLearningWeightTable
                deltas={Object.entries(profile.categoryWeights).map(([feature, proposedWeight]) => ({
                  featureGroup: "Category",
                  feature,
                  currentWeight: proposedWeight,
                  proposedWeight,
                  absoluteDelta: 0,
                  percentageDelta: 0,
                  observationCount: 0,
                  confidence: 1,
                  fallbackUsed: false,
                }))}
              />
            </details>
            <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Normalization: per-feature clamp [0.5, 2.0]. Deferred outcomes reduce weight; implemented outcomes increase
              weight. Missing categories use implicit fallback weight 1.0 until observed.
            </p>
          </article>
        ) : null}
      </div>

      <div className={OPERATOR_LAYOUT.sectionStack}>
        <article className="rounded-lg border border-al-border/70 p-4">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Outcome eligibility</h2>
          <dl className="m-0">
            <RecommendationLearningFieldRow label="Accepted" value={String(status.eligibility.accepted)} />
            <RecommendationLearningFieldRow label="Rejected" value={String(status.eligibility.rejected)} />
            <RecommendationLearningFieldRow label="Deferred" value={String(status.eligibility.deferred)} />
            <RecommendationLearningFieldRow label="Implemented" value={String(status.eligibility.implemented)} />
            <RecommendationLearningFieldRow label="Proposed (excluded)" value={String(status.eligibility.proposedExcluded)} />
            <RecommendationLearningFieldRow label="Truncated by batch cap" value={String(status.eligibility.truncatedByBatchCap)} />
          </dl>
          <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Rebuild scans up to {status.rebuildBatchCap} most recently updated non-proposed outcomes for the current
            tenant/workspace/project scope. Proposed-only rows are excluded. Demo/test exclusions follow repository filters.
          </p>
        </article>
        {previewPanel}
      </div>
    </section>
  );
}
