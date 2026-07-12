"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { initializeArchitectureCreation } from "@/lib/architecture-creation-init";
import {
  CREATE_ARCHITECTURE_NAVIGATION_FAILED_MESSAGE,
  CREATE_ARCHITECTURE_STARTING_LABEL,
} from "@/lib/review-start-progress-copy";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";

function preloadCreateArchitecturePageModules(): void {
  void import("@/app/(operator)/reviews/new/SocraticIntakeWizard");
}

/** Fast homepage navigation for Create Architecture — no review staged progress or question generation. */
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

    void router.prefetch(REVIEWS_NEW_CREATE_ARCHITECTURE_HREF);
    preloadCreateArchitecturePageModules();
    void initializeArchitectureCreation();

    startTransition(() => {
      try {
        router.push(REVIEWS_NEW_CREATE_ARCHITECTURE_HREF);
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
