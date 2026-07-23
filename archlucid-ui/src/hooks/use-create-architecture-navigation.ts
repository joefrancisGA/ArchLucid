"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import {
  CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE,
  CREATE_ARCHITECTURE_STARTING_LABEL,
} from "@/lib/review-start-progress-copy";

/** Soft-nav can stall without rejecting; recover the CTA instead of leaving it depressed. */
export const CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS = 20_000;

function preloadCreateArchitecturePageModules(): void {
  void import("@/components/architecture/ArchitectureCreationBootstrap");
  void import("@/components/architecture/ArchitectureDraftWorkspace");
}

/** Fast homepage navigation for Create Architecture — architecture route, no review initialization. */
export function useCreateArchitectureNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Own the depressed CTA in React state so timeouts always re-render (refs do not).
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutIdRef = useRef<number | null>(null);
  const wasPendingRef = useRef(false);

  const clearNavigationTimeout = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const releaseNavigation = useCallback(() => {
    clearNavigationTimeout();
    setIsNavigating(false);
  }, [clearNavigationTimeout]);

  const reset = useCallback(() => {
    releaseNavigation();
    setError(null);
  }, [releaseNavigation]);

  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;

      return;
    }

    if (wasPendingRef.current && isNavigating) {
      wasPendingRef.current = false;
      releaseNavigation();
    }
  }, [isNavigating, isPending, releaseNavigation]);

  useEffect(() => {
    return () => {
      clearNavigationTimeout();
    };
  }, [clearNavigationTimeout]);

  const navigate = useCallback(() => {
    if (isPending || isNavigating) {
      return;
    }

    setIsNavigating(true);
    setError(null);
    wasPendingRef.current = false;
    clearNavigationTimeout();

    timeoutIdRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      setError(CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE);
      timeoutIdRef.current = null;
    }, CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS);

    void router.prefetch(ARCHITECTURES_NEW_PATH);
    preloadCreateArchitecturePageModules();
    void initializeArchitectureCreation();

    startTransition(() => {
      try {
        router.push(ARCHITECTURES_NEW_PATH);
      } catch {
        reset();
        setError(CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE);
      }
    });
  }, [clearNavigationTimeout, isNavigating, isPending, reset, router]);

  return {
    navigate,
    reset,
    isNavigating,
    loadingLabel: CREATE_ARCHITECTURE_STARTING_LABEL,
    error,
  };
}
