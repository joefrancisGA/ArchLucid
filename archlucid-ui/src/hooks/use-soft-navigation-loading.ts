"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

/** Soft-nav / RSC refresh can stall without rejecting; recover CTAs instead of leaving them depressed. */
export const SOFT_NAVIGATION_TIMEOUT_MS = 20_000;

export type SoftNavigationMode = "push" | "replace" | "refresh";

export type UseSoftNavigationLoadingOptions = {
  readonly timeoutMs?: number;
  readonly timeoutErrorMessage?: string;
  readonly onTimeout?: () => void;
};

/**
 * Owns depressed-CTA state for client soft navigation.
 * Clears on transition settle or wall-clock timeout (refs alone never re-render).
 */
export function useSoftNavigationLoading(options: UseSoftNavigationLoadingOptions = {}) {
  const timeoutMs = options.timeoutMs ?? SOFT_NAVIGATION_TIMEOUT_MS;
  const timeoutErrorMessage = options.timeoutErrorMessage;
  const onTimeout = options.onTimeout;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const navigate = useCallback(
    (href: string, mode: SoftNavigationMode = "push") => {
      if (isPending || isNavigating) {
        return false;
      }

      setIsNavigating(true);
      setError(null);
      wasPendingRef.current = false;
      clearNavigationTimeout();

      timeoutIdRef.current = window.setTimeout(() => {
        setIsNavigating(false);
        timeoutIdRef.current = null;

        if (timeoutErrorMessage !== undefined) {
          setError(timeoutErrorMessage);
        }

        onTimeout?.();
      }, timeoutMs);

      if (mode !== "refresh") {
        void router.prefetch(href);
      }

      startTransition(() => {
        try {
          if (mode === "refresh") {
            router.refresh();
          } else if (mode === "replace") {
            router.replace(href);
          } else {
            router.push(href);
          }
        } catch {
          releaseNavigation();

          if (timeoutErrorMessage !== undefined) {
            setError(timeoutErrorMessage);
          }

          onTimeout?.();
        }
      });

      return true;
    },
    [
      clearNavigationTimeout,
      isNavigating,
      isPending,
      onTimeout,
      releaseNavigation,
      router,
      timeoutErrorMessage,
      timeoutMs,
    ],
  );

  return {
    navigate,
    reset,
    releaseNavigation,
    isNavigating,
    isPending,
    error,
    setError,
  };
}
