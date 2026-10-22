import { describe, expect, it } from "vitest";

import {
  architectureDescriptionPassesLiveE2eAdmission,
  liveE2eArchitectureDescription,
} from "./live-api-payloads";

describe("architectureDescriptionPassesLiveE2eAdmission", () => {
  it("admits plural APIs used by the greenfield wizard preset", () => {
    expect(
      architectureDescriptionPassesLiveE2eAdmission(
        "Greenfield customer-facing web application with authenticated APIs, need scalable hosting, SOC-friendly defaults, and cost visibility under $2k/month.",
      ),
    ).toBe(true);
  });

  it("rejects non-architecture prose", () => {
    expect(architectureDescriptionPassesLiveE2eAdmission("Write a chocolate cake recipe.")).toBe(false);
  });
});

describe("liveE2eArchitectureDescription", () => {
  it("passes through intent that already has domain terms", () => {
    expect(liveE2eArchitectureDescription("Assess a multi-tenant Azure API.")).toBe(
      "Assess a multi-tenant Azure API.",
    );
  });

  it("appends architecture vocabulary when the intent would be rejected", () => {
    const description = liveE2eArchitectureDescription("Private beta invitee UI wizard first meaningful action.");

    expect(architectureDescriptionPassesLiveE2eAdmission(description)).toBe(true);
    expect(description).toMatch(/architecture/i);
  });
});
