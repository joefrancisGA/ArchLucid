import { describe, expect, it } from "vitest";

import { recurrenceRunStatusPresentation } from "@/components/governance/recurrence-schedules-presentation";

describe("recurrenceRunStatusPresentation", () => {
  it("does not auto-disable when failure count is missing", () => {
    const presentation = recurrenceRunStatusPresentation({
      isEnabled: false,
      consecutiveFailureCount: undefined,
      lastRunStatus: "failed",
    } as never);

    expect(presentation.label).not.toBe("Auto-disabled");
  });

  it("labels missing last run status honestly", () => {
    const presentation = recurrenceRunStatusPresentation({
      isEnabled: true,
      consecutiveFailureCount: 0,
      lastRunStatus: "",
    } as never);

    expect(presentation.label).toBe("Last run status not returned");
  });
});
