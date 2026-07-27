"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { softNavigationTargetPathname } from "@/lib/soft-navigation-target-pathname";

/** Soft-nav / RSC refresh can stall without rejecting; recover CTAs instead of leaving them depressed. */
export const SOFT_NAVIGATION_TIMEOUT_MS = 20_000;

/**
 * Home Open Review and similar CTAs: align with client `navigation-stuck` (8s) and hard-nav if App Router never commits.
 */
export const SOFT_NAVIGATION_HARD_FALLBACK_TIMEOUT_MS = 8_000;

export type SoftNavigationMode = "push" | "replace" | "refresh";

export type UseSoftNavigationLoadingOptions = {
  readonly timeoutMs?: number;
  readonly timeoutErrorMessage?: string;
  readonly onTimeout?: () => void;
  /** When true (default), push/replace timeouts hard-navigate if the URL never committed. */
  readonly hardNavigateOnTimeout?: boolean;
};

/**
 * Owns depressed-CTA state for client soft navigation.
 * Clears only when the App Router commits the target pathname (or on wall-clock timeout).
 * Do not clear on useTransition settle — Next may drop isPending before the URL commits.
 */
export function useSoftNavigationLoading(options: UseSoftNavigationLoadingOptions = {}) {
  const timeoutMs = options.timeoutMs ?? SOFT_NAVIGATION_TIMEOUT_MS;
  const timeoutErrorMessage = options.timeoutErrorMessage;
  const onTimeout = options.onTimeout;
  const hardNavigateOnTimeout = options.hardNavigateOnTimeout !== false;

  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const pendingHrefRef = useRef<string | null>(null);
  const pendingModeRef = useRef<SoftNavigationMode>("push");

  const clearNavigationTimeout = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const releaseNavigation = useCallback(() => {
    clearNavigationTimeout();
    pendingHrefRef.current = null;
    setIsNavigating(false);
  }, [clearNavigationTimeout]);

  const reset = useCallback(() => {
    releaseNavigation();
    setError(null);
  }, [releaseNavigation]);

  // Release only after the URL actually commits — not when startTransition's isPending flickers.
  useEffect(() => {
    if (!isNavigating || pendingHrefRef.current === null) {
      return;
    }

    const pendingMode = pendingModeRef.current;

    if (pendingMode === "refresh") {
      return;
    }

    const targetPathname = softNavigationTargetPathname(
      pendingHrefRef.current,
      typeof window !== "undefined" ? window.location.origin : "http://localhost",
    );

    if (targetPathname.length > 0 && pathname === targetPathname) {
      releaseNavigation();
    }
  }, [isNavigating, pathname, releaseNavigation]);

  useEffect(() => {
    return () => {
      clearNavigationTimeout();
    };
  }, [clearNavigationTimeout]);

  const navigate = useCallback(
    (href: string, mode: SoftNavigationMode = "push") => {
      if (isNavigating) {
        return false;
      }

      setIsNavigating(true);
      setError(null);
      pendingHrefRef.current = href;
      pendingModeRef.current = mode;
      clearNavigationTimeout();

      timeoutIdRef.current = window.setTimeout(() => {
        const pendingHref = pendingHrefRef.current;
        const pendingMode = pendingModeRef.current;
        timeoutIdRef.current = null;
        setIsNavigating(false);

        if (
          hardNavigateOnTimeout &&
          pendingMode !== "refresh" &&
          typeof pendingHref === "string" &&
          pendingHref.length > 0
        ) {
          const targetPathname = softNavigationTargetPathname(pendingHref, window.location.origin);

          if (targetPathname.length > 0 && window.location.pathname !== targetPathname) {
            pendingHrefRef.current = null;
            window.location.assign(pendingHref);
            onTimeout?.();

            return;
          }
        }

        pendingHrefRef.current = null;

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
      hardNavigateOnTimeout,
      isNavigating,
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
    isPending: isNavigating,
    error,
    setError,
  };
}
