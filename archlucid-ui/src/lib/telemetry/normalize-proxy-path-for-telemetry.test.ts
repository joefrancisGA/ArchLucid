import { describe, expect, it } from "vitest";

import { normalizeProxyPathForTelemetry } from "@/lib/telemetry/normalize-proxy-path-for-telemetry";

describe("normalizeProxyPathForTelemetry", () => {
  it("collapses UUID segments and strips leading slash", () => {
    expect(
      normalizeProxyPathForTelemetry(
        "v1/architecture/run/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/execute",
      ),
    ).toBe("v1/architecture/run/[id]/execute");
  });

  it("handles empty and underscore placeholders", () => {
    expect(normalizeProxyPathForTelemetry("")).toBe("_");
    expect(normalizeProxyPathForTelemetry("_")).toBe("_");
  });
});
