import { describe, expect, it, vi } from "vitest";

import { dispatchOnboardingTourStart, onboardingTourAnchorForHref } from "./onboarding-tour";

describe("onboardingTourAnchorForHref", () => {
  it("maps new run and help hrefs", () => {
    expect(onboardingTourAnchorForHref("/architecture/reviews/new")).toBe("tour-new-run");
    expect(onboardingTourAnchorForHref("/help")).toBe("tour-help");
    expect(onboardingTourAnchorForHref("/architecture/reviews")).toBeUndefined();
  });

  it("dispatches the guided tour start event", () => {
    const handler = vi.fn();

    window.addEventListener("archlucid-onboarding-tour-start", handler);
    dispatchOnboardingTourStart();

    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener("archlucid-onboarding-tour-start", handler);
  });
});
