"use client";

import { useCallback } from "react";

import { clearArchitectureCreationDraftId } from "@/lib/architecture/architecture-creation-session";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
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

function preloadArchitectureDraftWorkspaceModules(): void {
  void import("@/components/architecture/ArchitectureDraftWorkspace");
}

/** Opens the new-architecture draft workspace — no server draft until the first field save. */
export function useCreateArchitectureNavigation() {
  const { navigate: softNavigate, reset, isNavigating, error } = useSoftNavigationLoading({
    timeoutErrorMessage: CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE,
  });

  const navigate = useCallback(() => {
    preloadArchitectureDraftWorkspaceModules();
    clearArchitectureCreationDraftId();
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
