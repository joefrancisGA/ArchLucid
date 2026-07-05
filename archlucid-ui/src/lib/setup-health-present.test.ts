import { describe, expect, it } from "vitest";

import { resolveSetupHealthPresentation } from "@/lib/setup-health-present";

describe("resolveSetupHealthPresentation", () => {
  it("marks healthy readiness as quiet setup health", () => {
    const result = resolveSetupHealthPresentation({ status: "Healthy", entries: [] });

    expect(result.isHealthy).toBe(true);
    expect(result.tone).toBe("ready");
    expect(result.label).toBe("Setup healthy");
  });

  it("marks unhealthy readiness as blocked, not healthy (regression: 'unhealthy' contains 'healthy')", () => {
    const result = resolveSetupHealthPresentation({ status: "Unhealthy", entries: [] });

    expect(result.isHealthy).toBe(false);
    expect(result.label).toBe("Setup blocked");
  });

  it("marks degraded readiness as attention", () => {
    const result = resolveSetupHealthPresentation({ status: "Degraded", entries: [] });

    expect(result.isHealthy).toBe(false);
    expect(result.label).toBe("Setup needs attention");
  });

  it("marks unavailable readiness as unknown", () => {
    const result = resolveSetupHealthPresentation(null);

    expect(result.isHealthy).toBe(false);
    expect(result.tone).toBe("unknown");
    expect(result.label).toBe("Workspace setup incomplete");
  });
});
