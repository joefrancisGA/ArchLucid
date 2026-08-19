import { describe, expect, it } from "vitest";

import { buildAuditActiveFilterChips } from "@/lib/audit-active-filter-chips";

describe("buildAuditActiveFilterChips", () => {
  it("builds chips for active filters only", () => {
    const chips = buildAuditActiveFilterChips({
      eventType: "RunCommitted",
      fromUtc: "",
      toUtc: "",
      correlationId: "",
      actorUserId: "",
      runId: "abc",
      auditDatePreset: "7d",
    });

    expect(chips.map((c) => c.id)).toEqual(["eventType", "datePreset", "runId"]);
    expect(chips.find((chip) => chip.id === "runId")?.label).toBe("Review selected");
  });
});
