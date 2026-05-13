"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { rebuildLearningProfile } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { LearningProfile } from "@/types/recommendation-learning";

import type { RecommendationLearningPageViewModel } from "./recommendation-learning-page-view-model";
import { RecommendationLearningPageView } from "./RecommendationLearningPageView";

type RecommendationLearningPageClientProps = {
  readonly initialProfile: LearningProfile | null;
  readonly initialFailure: ApiLoadFailureState | null;
};

export function RecommendationLearningPageClient(props: RecommendationLearningPageClientProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshing] = useTransition();
  const [profile, setProfile] = useState<LearningProfile | null>(props.initialProfile);
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(props.initialFailure);
  const [actionFailure, setActionFailure] = useState<ApiLoadFailureState | null>(null);

  useEffect(() => {
    setProfile(props.initialProfile);
    setLoadFailure(props.initialFailure);
    setActionFailure(null);
  }, [props.initialProfile, props.initialFailure]);

  const refreshFromServer = useCallback(() => {
    startRefreshing(() => {
      router.refresh();
    });
  }, [router]);

  const loadLatest = useCallback(async () => {
    refreshFromServer();
  }, [refreshFromServer]);

  const rebuild = useCallback(async () => {
    setActionFailure(null);

    try {
      await rebuildLearningProfile();
      refreshFromServer();
    } catch (e: unknown) {
      setActionFailure(toApiLoadFailure(e));
    }
  }, [refreshFromServer]);

  const mergedFailure = actionFailure ?? loadFailure;

  const model: RecommendationLearningPageViewModel = {
    profile,
    loading: isRefreshing,
    failure: mergedFailure,
    loadLatest,
    rebuild,
  };

  return <RecommendationLearningPageView model={model} />;
}
