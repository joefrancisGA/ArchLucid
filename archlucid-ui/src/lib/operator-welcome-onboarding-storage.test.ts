import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HAS_SEEN_ONBOARDING_STORAGE_KEY,
  persistHasSeenWelcomeOnboarding,
  readHasSeenWelcomeOnboarding,
} from "@/lib/operator-welcome-onboarding-storage";

describe("operator-welcome-onboarding-storage", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns false before any value is persisted", () => {
    expect(readHasSeenWelcomeOnboarding()).toBe(false);
  });

  it("persists and reads the onboarding dismissal flag under hasSeenOnboarding", () => {
    persistHasSeenWelcomeOnboarding();

    expect(window.localStorage.getItem(HAS_SEEN_ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(readHasSeenWelcomeOnboarding()).toBe(true);
  });

  it("treats read as false when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readHasSeenWelcomeOnboarding()).toBe(false);
  });
});
