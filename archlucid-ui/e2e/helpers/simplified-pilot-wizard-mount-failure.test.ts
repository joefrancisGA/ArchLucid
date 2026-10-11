import { describe, expect, it } from "vitest";

import { formatSimplifiedPilotWizardMountFailure } from "./simplified-pilot-wizard-mount-failure";

describe("formatSimplifiedPilotWizardMountFailure", () => {
  it("names a missing wizard with no visible shell and step 1 absent", () => {
    const message = formatSimplifiedPilotWizardMountFailure({
      pageUrl: "http://localhost:3000/architecture/reviews/new?baseline=1",
      visibleShells: [],
      stepOneRendered: false,
    });

    expect(message).toBe(
      "[simplified-pilot-wizard] Wizard did not mount. URL: http://localhost:3000/architecture/reviews/new?baseline=1. Visible shells: none. Step 1 rendered: no.",
    );
  });

  it("names the visible shell and step 1 when the progress marker rendered", () => {
    const message = formatSimplifiedPilotWizardMountFailure({
      pageUrl: "http://localhost:3000/architecture/reviews/new?baseline=1",
      visibleShells: ["reviews-new-path-switcher", "simplified-pilot-progress"],
      stepOneRendered: true,
    });

    expect(message).toContain("[simplified-pilot-wizard]");
    expect(message).toContain("Visible shells: reviews-new-path-switcher, simplified-pilot-progress.");
    expect(message).toContain("Step 1 rendered: yes.");
  });
});
