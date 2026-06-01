import { describe, expect, it } from "vitest";

import {
  FIRST_PILOT_OPERATOR_STATUS_VOCABULARY,
  mapReadinessStatusToEnterpriseKind,
  mapReadinessStatusToOperatorLabel,
  mapReadinessStatusToStatusTagLabel,
} from "@/lib/first-pilot-operator-status-vocabulary";

describe("first-pilot-operator-status-vocabulary", () => {
  it("maps readiness rows to canonical operator labels", () => {
    expect(mapReadinessStatusToOperatorLabel("ready")).toBe("READY");
    expect(mapReadinessStatusToOperatorLabel("attention")).toBe("NEEDS ATTENTION");
    expect(mapReadinessStatusToOperatorLabel("blocked")).toBe("BLOCKED");
    expect(mapReadinessStatusToOperatorLabel("unknown")).toBe("PENDING");
  });

  it("maps readiness rows to StatusTag kinds and title-case labels", () => {
    expect(mapReadinessStatusToEnterpriseKind("ready")).toBe("ready");
    expect(mapReadinessStatusToEnterpriseKind("attention")).toBe("needs-attention");
    expect(mapReadinessStatusToEnterpriseKind("unknown")).toBe("neutral");
    expect(mapReadinessStatusToStatusTagLabel("unknown")).toBe("Pending");
    expect(mapReadinessStatusToStatusTagLabel("attention")).toBe("Needs attention");
  });

  it("documents the shared vocabulary strings", () => {
    expect(FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.nextAction).toContain("NEXT ACTION");
    expect(FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.deferred).toContain("DEFERRED");
  });
});
