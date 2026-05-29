import { describe, expect, it } from "vitest";

import {
  FIRST_PILOT_OPERATOR_STATUS_VOCABULARY,
  mapReadinessStatusToOperatorLabel,
} from "@/lib/first-pilot-operator-status-vocabulary";

describe("first-pilot-operator-status-vocabulary", () => {
  it("maps readiness rows to canonical operator labels", () => {
    expect(mapReadinessStatusToOperatorLabel("ready")).toBe("READY");
    expect(mapReadinessStatusToOperatorLabel("attention")).toBe("WARN");
    expect(mapReadinessStatusToOperatorLabel("blocked")).toBe("HOLD");
    expect(mapReadinessStatusToOperatorLabel("unknown")).toBe("PENDING");
  });

  it("documents the shared vocabulary strings", () => {
    expect(FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.nextAction).toContain("NEXT ACTION");
    expect(FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.deferred).toContain("DEFERRED");
  });
});
