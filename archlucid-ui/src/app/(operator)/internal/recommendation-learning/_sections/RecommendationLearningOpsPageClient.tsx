"use client";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PilotFeedbackRecommendationLearningVocabularyRail } from "@/components/PilotFeedbackRecommendationLearningVocabularyRail";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RecommendationLearningEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { INTERNAL_OPERATIONS_NAV_EYEBROW } from "@/lib/demo-readiness-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { LearningProfile } from "@/types/recommendation-learning";
import type {
  RecommendationLearningOperationalStatus,
  RecommendationLearningProfileHistoryItem,
} from "@/types/recommendation-learning-operational";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

import { RecommendationLearningOpsPreviewPanel } from "./RecommendationLearningOpsPreviewPanel";
import { RecommendationLearningOpsStatusPanel } from "./RecommendationLearningOpsStatusPanel";
import { RecommendationLearningOpsVersionHistoryTableShell } from "./RecommendationLearningOpsVersionHistoryTableShell";
import { RecommendationLearningWeightTable } from "./RecommendationLearningWeightTable";
import { deployEnvironmentStatusTagKind } from "./recommendation-learning-ops-display";
import { useRecommendationLearningOpsState } from "./use-recommendation-learning-ops-state";

type Props = {
  readonly initialStatus: RecommendationLearningOperationalStatus | null;
  readonly initialProfile: LearningProfile | null;
  readonly initialHistory: RecommendationLearningProfileHistoryItem[];
  readonly initialFailure: ApiLoadFailureState | null;
};

export function RecommendationLearningOpsPageClient(props: Props) {
  const model = useRecommendationLearningOpsState(props);

  if (model.status === null && model.failure !== null) {
    return (
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="recommendation-learning-ops-page">
        <OperatorPageHeader
          navHref={RECOMMENDATION_LEARNING_CANONICAL_PATH}
          headingLevel="h1"
          title="Recommendation learning"
          titleTestId="recommendation-learning-page-title"
          metadata={
            <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)} data-testid="recommendation-learning-ops-eyebrow">
              {INTERNAL_OPERATIONS_NAV_EYEBROW}
            </p>
          }
          subtitle="Inspect and rebuild the recommendation-ranking profile derived from historical accepted, deferred, rejected, and implemented outcomes."
          actions={<PageContextualHelpButton />}
        />
        <RecommendationLearningEvidenceOrientationStrip />
        <OperatorSectionLoadFailure
          message={model.failure.message}
          retryLabel="Refresh operational data"
          retrying={model.isRefreshing}
          testId="recommendation-learning-ops-load-failure"
          onRetry={() => void model.refresh()}
        />
      </OperatorPageContainer>
    );
  }

  if (model.status === null) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Recommendation learning"
        description="Connect a tenant scope to inspect recommendation-ranking profiles and rebuild history."
      />
    );
  }

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="recommendation-learning-ops-page">
      <OperatorPageHeader
        navHref={RECOMMENDATION_LEARNING_CANONICAL_PATH}
        headingLevel="h1"
        title="Recommendation learning"
        titleTestId="recommendation-learning-page-title"
        metadata={
          <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)} data-testid="recommendation-learning-ops-eyebrow">
            {INTERNAL_OPERATIONS_NAV_EYEBROW}
          </p>
        }
        subtitle="Inspect and rebuild the recommendation-ranking profile derived from historical accepted, deferred, rejected, and implemented outcomes."
        statusBadge={
          <StatusTag
            kind={deployEnvironmentStatusTagKind()}
            label={model.environmentLabel}
            data-testid="recommendation-learning-environment-tag"
          />
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RefreshButton
              busy={model.isRefreshing}
              disabled={model.isLoadingPersisted}
              onClick={() => void model.refresh()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={model.busyAction !== null || model.isRefreshing || model.isLoadingPersisted}
              onClick={() => void model.loadPersistedProfile()}
            >
              {model.isLoadingPersisted ? "Loading profile…" : "Load persisted profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!model.canMutate || !model.canBuild || model.busyAction !== null}
              onClick={() => void model.runPreview()}
            >
              {model.busyAction === "preview" ? "Previewing…" : "Preview rebuild"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!model.canMutate || !model.canBuild || model.busyAction !== null}
              onClick={() => void model.runRebuild()}
            >
              {model.busyAction === "rebuild" ? "Rebuilding…" : "Rebuild from historical outcomes"}
            </Button>
            <PageContextualHelpButton />
          </div>
        }
      >
        <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Scope: {model.status.scopeLabel} · Model: {model.status.activeProfile?.algorithmVersion ?? "recommendation-ranking-v1"} ·
          Feature schema: {model.status.activeProfile?.featureSchemaVersion ?? "outcome-stats-v1"}
        </p>
      </OperatorPageHeader>

      <RecommendationLearningEvidenceOrientationStrip />

      <PilotFeedbackRecommendationLearningVocabularyRail currentSurfaceId="recommendation-learning" />

      <div className="grid gap-2 sm:grid-cols-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Refresh operational data — reload eligibility counts, profile metadata, and version history from the API.
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Load persisted profile — fetch the latest stored weighting profile only, without recomputing weights or
          refreshing eligibility counts.
        </p>
      </div>
      {!model.canMutate ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="recommendation-learning-read-only-hint">
          Preview and rebuild require ExecuteAuthority. You can still inspect status and eligibility.
        </p>
      ) : null}

      {model.failure ? (
        <OperatorSectionLoadFailure
          message={
            model.failure.correlationId
              ? `${model.failure.message} (Correlation ID: ${model.failure.correlationId})`
              : model.failure.message
          }
          testId="recommendation-learning-ops-operation-failure"
        />
      ) : null}

      <RecommendationLearningOpsStatusPanel
        status={model.status}
        profile={model.profile}
        canMutate={model.canMutate}
        onRefresh={() => void model.refresh()}
        onPreview={() => void model.runPreview()}
        onRebuild={() => void model.runRebuild()}
        previewPanel={model.preview ? <RecommendationLearningOpsPreviewPanel preview={model.preview} /> : null}
      />

      {model.preview && model.weightDeltas.length > 0 ? (
        <section className="rounded-lg border border-al-border/70 p-4">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Before-and-after impact analysis</h2>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {model.weightDeltas.filter((row) => Math.abs(Number(row.absoluteDelta ?? 0)) > 0.001).length} weighted features change in the
            preview. Largest upward movement:{" "}
            {model.weightDeltas.reduce(
              (best, row) =>
                Number(row.absoluteDelta ?? 0) > Number(best.absoluteDelta ?? 0) ? row : best,
              model.weightDeltas[0],
            ).feature}.
          </p>
          <RecommendationLearningWeightTable deltas={model.weightDeltas} />
        </section>
      ) : null}

      {model.production ? (
        <section className="rounded-lg border border-al-border/70 p-4" data-testid="recommendation-learning-production-activation">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Production activation</h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Rebuild in production requires an operational reason recorded with the activation.
          </p>
          <label className="mt-3 block space-y-1">
            <span className={OPERATOR_TYPOGRAPHY.body}>Operational reason (required for rebuild in production)</span>
            <Textarea
              className="min-h-20 bg-al-surface-raised font-mono text-al-text-primary placeholder:text-al-text-placeholder"
              value={model.activateReason}
              onChange={(event) => model.setActivateReason(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      <RecommendationLearningOpsVersionHistoryTableShell
        history={model.history}
        canMutate={model.canMutate}
        busyAction={model.busyAction}
        rollbackProfileId={model.rollbackProfileId}
        setRollbackProfileId={model.setRollbackProfileId}
        rollbackReason={model.rollbackReason}
        setRollbackReason={model.setRollbackReason}
        runRollback={model.runRollback}
      />
    </OperatorPageContainer>
  );
}
