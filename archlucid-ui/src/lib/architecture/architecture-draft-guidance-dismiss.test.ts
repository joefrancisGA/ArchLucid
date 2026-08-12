import { afterEach, describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY,
  isArchitectureDraftGuidanceDismissed,
  persistArchitectureDraftGuidanceDismissed,
} from "@/lib/architecture/architecture-draft-guidance-dismiss";

describe("architecture-draft-guidance-dismiss", () => {
  afterEach(() => {
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
  });

  it("reports not dismissed by default", () => {
    expect(isArchitectureDraftGuidanceDismissed()).toBe(false);
  });

  it("persists dismissal in localStorage", () => {
    persistArchitectureDraftGuidanceDismissed();

    expect(window.localStorage.getItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY)).toBe("1");
    expect(isArchitectureDraftGuidanceDismissed()).toBe(true);
  });
});
