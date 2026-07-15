"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import {
  CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE,
  CREATE_ARCHITECTURE_STARTING_LABEL,
} from "@/lib/review-start-progress-copy";

function preloadCreateArchitecturePageModules(): void {
  void import("@/components/architecture/ArchitectureCreationBootstrap");
  void import("@/components/architecture/ArchitectureDraftWorkspace");
}

/** Fast homepage navigation for Create Architecture — architecture route, no review initialization. */
export function useCreateArchitectureNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const reset = useCallback(() => {
    setError(null);
    inFlightRef.current = false;
  }, []);

  useEffect(() => {
    if (!isPending && inFlightRef.current) {
      inFlightRef.current = false;
    }
  }, [isPending]);

  const navigate = useCallback(() => {
    if (isPending || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setError(null);

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
  }, [isPending, reset, router]);

  return {
    navigate,
    reset,
    isNavigating: isPending || inFlightRef.current,
    loadingLabel: CREATE_ARCHITECTURE_STARTING_LABEL,
    error,
  };
}
