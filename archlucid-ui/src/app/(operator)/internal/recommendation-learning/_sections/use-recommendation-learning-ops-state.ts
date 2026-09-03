"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { LearningProfile } from "@/types/recommendation-learning";
import type {
  RecommendationLearningOperationalStatus,
  RecommendationLearningPreview,
  RecommendationLearningProfileHistoryItem,
} from "@/types/recommendation-learning-operational";

import {
  executeRecommendationLearningPreview,
  executeRecommendationLearningRebuild,
  executeRecommendationLearningRollback,
  reloadPersistedRecommendationLearningProfileOnly,
  reloadRecommendationLearningOpsBundle,
} from "./load-recommendation-learning-ops-page-data";
import {
  isProductionDeployEnvironment,
  resolveDeployEnvironmentLabel,
} from "./recommendation-learning-ops-display";

type InitialProps = {
  readonly initialStatus: RecommendationLearningOperationalStatus | null;
  readonly initialProfile: LearningProfile | null;
  readonly initialHistory: RecommendationLearningProfileHistoryItem[];
  readonly initialFailure: ApiLoadFailureState | null;
};

export function useRecommendationLearningOpsState(props: InitialProps) {
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
  const weightDeltas = preview?.weightDeltas ?? [];

  return {
    canMutate,
    isRefreshing,
    status,
    profile,
    history,
    failure,
    preview,
    busyAction,
    isLoadingPersisted,
    rollbackReason,
    setRollbackReason,
    rollbackProfileId,
    setRollbackProfileId,
    activateReason,
    setActivateReason,
    environmentLabel,
    production,
    refresh,
    loadPersistedProfile,
    runPreview,
    runRebuild,
    runRollback,
    canBuild,
    weightDeltas,
  };
}

export type RecommendationLearningOpsState = ReturnType<typeof useRecommendationLearningOpsState>;
