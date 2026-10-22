import { describe, expect, it } from "vitest";

import { resolveFindingTraceCompletenessDisplay } from "@/lib/findings/finding-trace-completeness-display";

describe("resolveFindingTraceCompletenessDisplay", () => {
  it("does not treat missing ratio as 0% minimal", () => {
    const display = resolveFindingTraceCompletenessDisplay(undefined);

    expect(display.recorded).toBe(false);
    expect(display.ratioPct).toBeNull();
    expect(display.summaryLine).toContain("Not recorded");
  });

  it("maps a recorded ratio to percent", () => {
    const display = resolveFindingTraceCompletenessDisplay(0.75);

    expect(display.recorded).toBe(true);
    expect(display.ratioPct).toBe(75);
  });
});
