import { describe, expect, it } from "vitest";

import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";
import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

describe("SECURENOW_NAV_LABELS", () => {
  it("title-cases every sidebar label", () => {
    for (const label of Object.values(SECURENOW_NAV_LABELS)) {
      expect(label).toBe(secureNowTitleCase(label));
    }
  });

  it("uses SecureNow product naming for Teams", () => {
    expect(SECURENOW_NAV_LABELS["/integrations/teams"]).toBe("Teams");
  });

  it("title-cases representative infrastructure destinations", () => {
    expect(SECURENOW_NAV_LABELS["/infrastructure/ask"]).toBe("Ask About Your Environment");
    expect(SECURENOW_NAV_LABELS["/security/assigned-to-me"]).toBe("My Findings");
    expect(SECURENOW_NAV_LABELS["/infrastructure/snapshots-drift"]).toBe("Changes & Drift");
  });
});
