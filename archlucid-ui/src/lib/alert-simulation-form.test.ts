import { describe, expect, it } from "vitest";

import {
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER,
  resolveAlertSimulationRunProjectSlug,
} from "@/lib/alert-simulation-form";
import { DEV_SCOPE_PROJECT_ID } from "@/lib/scope";

describe("alert-simulation-form", () => {
  it("keeps the review-id placeholder empty (no zero-GUID theater)", () => {
    expect(ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER).toBe("");
    expect(ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER).not.toContain("00000000");
  });

  it("uses Current project as the slug placeholder instead of default", () => {
    expect(ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER).toBe("Current project");
    expect(ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER.toLowerCase()).not.toBe("default");
  });

  it("prefers a typed project slug over session", () => {
    expect(resolveAlertSimulationRunProjectSlug("claims-intake", DEV_SCOPE_PROJECT_ID)).toBe("claims-intake");
  });

  it("resolves blank typed slug from session without inventing default in the typed field", () => {
    expect(resolveAlertSimulationRunProjectSlug("", "claims-intake")).toBe("claims-intake");
    expect(resolveAlertSimulationRunProjectSlug("  ", DEV_SCOPE_PROJECT_ID)).toBe("default");
    expect(resolveAlertSimulationRunProjectSlug(undefined, undefined)).toBe("default");
  });
});
