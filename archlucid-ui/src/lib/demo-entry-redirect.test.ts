import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: vi.fn(() => false),
}));

vi.mock("@/lib/buyer-cto-demo-tour", () => ({
  getStartCtoDemoTourHref: vi.fn(() => "/executive/reviews/showcase?ctoDemoTour=1"),
}));

import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { resolveDemoEntryRedirectHref } from "@/lib/demo-entry-redirect";

describe("resolveDemoEntryRedirectHref", () => {
  beforeEach(() => {
    vi.mocked(isCtoDemoPackEnv).mockReturnValue(false);
  });

  it("redirects to home when demo packaging is disabled", () => {
    expect(resolveDemoEntryRedirectHref()).toBe("/");
    expect(getStartCtoDemoTourHref).not.toHaveBeenCalled();
  });

  it("redirects to CTO tour step 1 when demo packaging is enabled", () => {
    vi.mocked(isCtoDemoPackEnv).mockReturnValue(true);

    expect(resolveDemoEntryRedirectHref()).toBe("/executive/reviews/showcase?ctoDemoTour=1");
    expect(getStartCtoDemoTourHref).toHaveBeenCalledTimes(1);
  });
});
