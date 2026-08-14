import { describe, expect, it } from "vitest";

import { normalizeTelemetryRoute } from "@/lib/telemetry/telemetry-route-normalizer";

describe("normalizeTelemetryRoute", () => {
  it("replaces UUID and run id segments with stable tokens", () => {
    expect(
      normalizeTelemetryRoute(
        "/architecture/reviews/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/findings?tab=open",
      ),
    ).toBe("/architecture/reviews/[reviewId]/findings");
  });

  it("preserves static operator routes", () => {
    expect(normalizeTelemetryRoute("/governance/findings")).toBe("/governance/findings");
    expect(normalizeTelemetryRoute("/welcome")).toBe("/welcome");
  });
});
