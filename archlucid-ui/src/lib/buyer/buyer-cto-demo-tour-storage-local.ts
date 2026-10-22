import {
  BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY,
} from "@/lib/buyer/buyer-cto-demo-tour-storage-keys";

export function readBuyerCtoDemoTourActive(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoTourActive(active: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (active) {
      window.localStorage.setItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoAutoplay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoAutoplay(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.localStorage.setItem(BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}
