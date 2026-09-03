import {
  BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY,
  BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY,
  BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY,
  BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY,
  BUYER_CTO_DEMO_STORY_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
} from "@/lib/buyer/buyer-cto-demo-tour-storage-keys";

export function readBuyerCtoDemoTourCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoTourCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (collapsed) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoPresenterNotesVisible(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY);

    if (raw === "0") {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

export function writeBuyerCtoDemoPresenterNotesVisible(visible: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (visible) {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY, "0");
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoVisitedSteps(): ReadonlySet<number> {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return new Set<number>();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    const indices = parsed.filter((value): value is number => typeof value === "number" && Number.isInteger(value));

    return new Set<number>(indices);
  } catch {
    return new Set<number>();
  }
}

export function writeBuyerCtoDemoVisitedStep(stepIndex: number): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    return;
  }

  try {
    const visited = readBuyerCtoDemoVisitedSteps();
    const next = new Set<number>(visited);
    next.add(stepIndex);
    window.sessionStorage.setItem(
      BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
      JSON.stringify([...next].sort((a, b) => a - b)),
    );
  } catch {
    /* private mode */
  }
}

export function clearBuyerCtoDemoVisitedSteps(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoSpotlight(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoSpotlight(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoStoryId(): string {
  if (typeof window === "undefined") {
    return "healthcare";
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_STORY_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return "healthcare";
    }

    return raw.trim();
  } catch {
    return "healthcare";
  }
}

export function writeBuyerCtoDemoStoryId(id: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(BUYER_CTO_DEMO_STORY_STORAGE_KEY, id.trim());
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoExploreMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoExploreMode(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoPresenterLayerVisible(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function readBuyerCtoDemoPreflightAcknowledged(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoPreflightAcknowledged(acknowledged: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (acknowledged) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function writeBuyerCtoDemoPresenterLayerVisible(visible: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (visible) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoPresenterNotesFullScript(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY);

    if (raw === "0") {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

export function writeBuyerCtoDemoPresenterNotesFullScript(fullScript: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (fullScript) {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY, "0");
    }
  } catch {
    /* private mode */
  }
}
