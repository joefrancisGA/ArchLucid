"use client";

import { useSyncExternalStore } from "react";

import { isReviewPresenterChromeActive } from "@/lib/review-presenter-chrome-active";

function subscribePresenterChrome(callback: () => void): () => void {
  window.addEventListener("popstate", callback);

  return () => {
    window.removeEventListener("popstate", callback);
  };
}

/** Client hook mirroring {@link isReviewPresenterChromeActive} for shell chrome gating. */
export function useReviewPresenterChromeActive(): boolean {
  return useSyncExternalStore(subscribePresenterChrome, isReviewPresenterChromeActive, () => false);
}
