"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PilotFeedbackRecommendationLearningVocabularyRail } from "@/components/PilotFeedbackRecommendationLearningVocabularyRail";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RecommendationLearningEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { INTERNAL_OPERATIONS_NAV_EYEBROW } from "@/lib/demo-readiness-evidence-copy";
import { OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { LearningProfile } from "@/types/recommendation-learning";
import type {
  RecommendationLearningOperationalStatus,
  RecommendationLearningPreview,
  RecommendationLearningProfileHistoryItem,
} from "@/types/recommendation-learning-operational";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

import {
  executeRecommendationLearningPreview,
  executeRecommendationLearningRebuild,
  executeRecommendationLearningRollback,
  reloadPersistedRecommendationLearningProfileOnly,
  reloadRecommendationLearningOpsBundle,
} from "./load-recommendation-learning-ops-page-data";
import { RecommendationLearningOpsPreviewPanel } from "./RecommendationLearningOpsPreviewPanel";
import { RecommendationLearningOpsStatusPanel } from "./RecommendationLearningOpsStatusPanel";
import { RecommendationLearningWeightTable } from "./RecommendationLearningWeightTable";
import {
  deployEnvironmentStatusTagKind,
  formatOperationalTimestamp,
  isProductionDeployEnvironment,
  profileVersionStatusTagKind,
  resolveDeployEnvironmentLabel,
} from "./recommendation-learning-ops-display";

type Props = {
  readonly initialStatus: RecommendationLearningOperationalStatus | null;
  readonly initialProfile: LearningProfile | null;
  readonly initialHistory: RecommendationLearningProfileHistoryItem[];
  readonly initialFailure: ApiLoadFailureState | null;
};

export function RecommendationLearningOpsPageClient(props: Props) {
  const router = useRouter();
  const canMutate = useOperateCapability();
  const [isRefreshing, startRefreshing] = useTransition();
  const [status, setStatus] = useState(props.initialStatus);
  const [profile, setProfile] = useState(props.initialProfile);
  const [history, setHistory] = useState(props.initialHistory);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(props.initialFailure);
  const [preview, setPreview] = useState<RecommendationLearningPreview | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [isLoadingPersisted, setIsLoadingPersisted] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackProfileId, setRollbackProfileId] = useState<string | null>(null);
  const [activateReason, setActivateReason] = useState("");

  const environmentLabel = resolveDeployEnvironmentLabel();
  const production = isProductionDeployEnvironment();

  useEffect(() => {
    setStatus(props.initialStatus);
    setProfile(props.initialProfile);
    setHistory(props.initialHistory);
    setFailure(props.initialFailure);
  }, [props.initialFailure, props.initialHistory, props.initialProfile, props.initialStatus]);

  const refresh = useCallback(async () => {
    startRefreshing(() => {
      router.refresh();
    });

    try {
      const bundle = await reloadRecommendationLearningOpsBundle();
      setStatus(bundle.status);
      setProfile(bundle.profile);
      setHistory(bundle.history);
      setFailure(null);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    }
  }, [router]);

  const loadPersistedProfile = useCallback(async () => {
    setIsLoadingPersisted(true);
    setFailure(null);

    try {
      const persistedProfile = await reloadPersistedRecommendationLearningProfileOnly();
      setProfile(persistedProfile);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setIsLoadingPersisted(false);
    }
  }, []);

  const runPreview = useCallback(async () => {
    if (!canMutate) {
      return null;
    }

    setBusyAction("preview");
    setFailure(null);

    try {
      const result = await executeRecommendationLearningPreview();
      setPreview(result);
      return result;
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
      return null;
    } finally {
      setBusyAction(null);
    }
  }, [canMutate]);

  const runRebuild = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    if (production && activateReason.trim().length < 8) {
      setFailure({
        message: "Enter an operational reason (minimum 8 characters) before rebuilding in production.",
        problem: null,
        correlationId: null,
        httpStatus: 409,
        retryAfterSeconds: null,
      });
      return;
    }

    setBusyAction("rebuild");
    setFailure(null);

    try {
      await executeRecommendationLearningRebuild();
      await refresh();
      setPreview(null);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setBusyAction(null);
    }
  }, [activateReason, canMutate, production, refresh]);

  const runRollback = useCallback(async () => {
    if (!canMutate || rollbackProfileId === null) {
      return;
    }

    if (rollbackReason.trim().length < 8) {
      setFailure({
        message: "Enter an operational reason (minimum 8 characters) before rollback.",
        problem: null,
        correlationId: null,
        httpStatus: 409,
        retryAfterSeconds: null,
      });
      return;
    }

    setBusyAction("rollback");
    setFailure(null);

    try {
      await executeRecommendationLearningRollback(rollbackProfileId, rollbackReason.trim());
      setRollbackProfileId(null);
      setRollbackReason("");
      await refresh();
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setBusyAction(null);
    }
  }, [canMutate, refresh, rollbackProfileId, rollbackReason]);

  const canBuild = (status?.eligibleOutcomeCount ?? 0) >= (status?.minimumRequiredOutcomes ?? 1);

  if (status === null && failure !== null) {
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
          message={failure.message}
          retryLabel="Refresh operational data"
          retrying={isRefreshing}
          testId="recommendation-learning-ops-load-failure"
          onRetry={() => void refresh()}
        />
      </OperatorPageContainer>
    );
  }

  if (status === null) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Recommendation learning"
        description="Connect a tenant scope to inspect recommendation-ranking profiles and rebuild history."
      />
    );
  }

  const weightDeltas = preview?.weightDeltas ?? [];

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
            label={environmentLabel}
            data-testid="recommendation-learning-environment-tag"
          />
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RefreshButton
              busy={isRefreshing}
              disabled={isLoadingPersisted}
              onClick={() => void refresh()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null || isRefreshing || isLoadingPersisted}
              onClick={() => void loadPersistedProfile()}
            >
              {isLoadingPersisted ? "Loading profile…" : "Load persisted profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canMutate || !canBuild || busyAction !== null}
              onClick={() => void runPreview()}
            >
              {busyAction === "preview" ? "Previewing…" : "Preview rebuild"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!canMutate || !canBuild || busyAction !== null}
              onClick={() => void runRebuild()}
            >
              {busyAction === "rebuild" ? "Rebuilding…" : "Rebuild from historical outcomes"}
            </Button>
            <PageContextualHelpButton />
          </div>
        }
      >
        <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Scope: {status.scopeLabel} · Model: {status.activeProfile?.algorithmVersion ?? "recommendation-ranking-v1"} ·
          Feature schema: {status.activeProfile?.featureSchemaVersion ?? "outcome-stats-v1"}
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
      {!canMutate ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="recommendation-learning-read-only-hint">
          Preview and rebuild require ExecuteAuthority. You can still inspect status and eligibility.
        </p>
      ) : null}

      {failure ? (
        <OperatorSectionLoadFailure
          message={
            failure.correlationId
              ? `${failure.message} (Correlation ID: ${failure.correlationId})`
              : failure.message
          }
          testId="recommendation-learning-ops-operation-failure"
        />
      ) : null}

      <RecommendationLearningOpsStatusPanel
        status={status}
        profile={profile}
        canMutate={canMutate}
        onRefresh={() => void refresh()}
        onPreview={() => void runPreview()}
        onRebuild={() => void runRebuild()}
        previewPanel={preview ? <RecommendationLearningOpsPreviewPanel preview={preview} /> : null}
      />

      {preview && weightDeltas.length > 0 ? (
        <section className="rounded-lg border border-al-border/70 p-4">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Before-and-after impact analysis</h2>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {weightDeltas.filter((row) => Math.abs(row.absoluteDelta) > 0.001).length} weighted features change in the
            preview. Largest upward movement:{" "}
            {weightDeltas.reduce((best, row) => (row.absoluteDelta > best.absoluteDelta ? row : best), weightDeltas[0]).feature}.
          </p>
          <RecommendationLearningWeightTable deltas={weightDeltas} />
        </section>
      ) : null}

      {production ? (
        <section className="rounded-lg border border-al-border/70 p-4" data-testid="recommendation-learning-production-activation">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Production activation</h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Rebuild in production requires an operational reason recorded with the activation.
          </p>
          <label className="mt-3 block space-y-1">
            <span className={OPERATOR_TYPOGRAPHY.body}>Operational reason (required for rebuild in production)</span>
            <Textarea
              className="min-h-20 bg-al-surface-raised font-mono text-al-text-primary placeholder:text-al-text-placeholder"
              value={activateReason}
              onChange={(event) => setActivateReason(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      <section className="rounded-lg border border-al-border/70 p-4">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Version history</h2>
        <EnterpriseTable ariaLabel="Recommendation learning profile version history">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Version</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Built</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Outcomes</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {history.map((item) => (
              <EnterpriseTableRow key={item.profileId}>
                <EnterpriseTableCell className="font-mono text-xs">{item.profileId}</EnterpriseTableCell>
                <EnterpriseTableCell>{formatOperationalTimestamp(item.generatedUtc)}</EnterpriseTableCell>
                <EnterpriseTableCell>{item.outcomeCount}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag
                    kind={profileVersionStatusTagKind(item.isActive)}
                    label={item.isActive ? "Active" : "Historical"}
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  {!item.isActive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canMutate || busyAction !== null}
                      onClick={() => setRollbackProfileId(item.profileId)}
                    >
                      Roll back to this version
                    </Button>
                  ) : (
                    " — "
                  )}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
        {rollbackProfileId ? (
          <div className="mt-4 space-y-2 rounded border border-al-border/60 p-3">
            <p className="m-0 font-mono text-sm">Rollback target: {rollbackProfileId}</p>
            <Textarea
              className="min-h-20 bg-al-surface-raised font-mono text-al-text-primary placeholder:text-al-text-placeholder"
              placeholder="Operational reason (required)"
              value={rollbackReason}
              onChange={(event) => setRollbackReason(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" disabled={busyAction !== null} onClick={() => void runRollback()}>
                Confirm rollback
              </Button>
              <Button type="button" variant="outline" onClick={() => setRollbackProfileId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </OperatorPageContainer>
  );
}
