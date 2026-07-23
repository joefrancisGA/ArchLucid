"use client";

import { useCallback } from "react";

import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import {
  CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE,
  CREATE_ARCHITECTURE_STARTING_LABEL,
} from "@/lib/review-start-progress-copy";
import {
  SOFT_NAVIGATION_TIMEOUT_MS,
  useSoftNavigationLoading,
} from "@/hooks/use-soft-navigation-loading";

/** @deprecated Prefer SOFT_NAVIGATION_TIMEOUT_MS — kept for existing test imports. */
export const CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS = SOFT_NAVIGATION_TIMEOUT_MS;

function preloadCreateArchitecturePageModules(): void {
  void import("@/components/architecture/ArchitectureCreationBootstrap");
  void import("@/components/architecture/ArchitectureDraftWorkspace");
}

/** Fast homepage navigation for Create Architecture — architecture route, no review initialization. */
export function useCreateArchitectureNavigation() {
  const { navigate: softNavigate, reset, isNavigating, error } = useSoftNavigationLoading({
    timeoutErrorMessage: CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE,
  });

  const navigate = useCallback(() => {
    preloadCreateArchitecturePageModules();
    void initializeArchitectureCreation();
    softNavigate(ARCHITECTURES_NEW_PATH);
  }, [softNavigate]);

  return {
    navigate,
    reset,
    isNavigating,
    loadingLabel: CREATE_ARCHITECTURE_STARTING_LABEL,
    error,
  };
}
