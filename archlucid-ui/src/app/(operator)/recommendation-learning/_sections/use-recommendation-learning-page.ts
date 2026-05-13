"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getLatestLearningProfile, rebuildLearningProfile } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { LearningProfile } from "@/types/recommendation-learning";

import type { RecommendationLearningPageViewModel } from "./recommendation-learning-page-view-model";

export function useRecommendationLearningPage(): RecommendationLearningPageViewModel {
  const router = useRouter();
  const demoMode = isNextPublicDemoMode();
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  useEffect(() => {
    if (!demoMode) {
      return;
    }

    router.replace("/");
  }, [demoMode, router]);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await getLatestLearningProfile();
      setProfile(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const rebuild = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await rebuildLearningProfile();
      setProfile(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    demoMode,
    profile,
    loading,
    failure,
    loadLatest,
    rebuild,
  };
}
