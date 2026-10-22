/** Buyer CTO demo tour persistence surface (barrel). */

export * from "./buyer-cto-demo-tour-storage-keys";
export * from "./buyer-cto-demo-tour-storage-local";
export * from "./buyer-cto-demo-tour-storage-session";

import {
  BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY,
  BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY,
  BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY,
  BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY,
  BUYER_CTO_DEMO_STORY_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
} from "./buyer-cto-demo-tour-storage-keys";

/**
 * Hard-resets all CTO demo tour state: localStorage active flag, autoplay, and all sessionStorage
 * tour keys (collapsed, visited steps, notes prefs, spotlight, story selection).
 * Use before starting a fresh audience or after a botched demo attempt.
 */
export function clearBuyerCtoDemoState(): void {
  if (typeof window === "undefined") {
    return;
  }

  const localKeys = [
    BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY,
  ];

  const sessionKeys = [
    BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
    BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY,
    BUYER_CTO_DEMO_STORY_STORAGE_KEY,
    BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY,
    BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY,
    BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY,
  ];

  try {
    for (const key of localKeys) {
      window.localStorage.removeItem(key);
    }

    for (const key of sessionKeys) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    /* private mode — best effort */
  }
}
