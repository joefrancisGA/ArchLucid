import { describe, expect, it } from "vitest";

import { SECURENOW_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveSecureNowFindingsQueueOpenGate } from "@/lib/product-line/securenow-findings-queue-open-gate";

describe("securenow-findings-queue-open-gate", () => {
  it("returns every active gate in reviewer order", () => {
    const gates = resolveSecureNowFindingsQueueOpenGate("security", {
      isAssignedToMe: false,
      pendingOwner: 2,
      openRisks: 5,
      overdueReview: 1,
    });

    expect(gates.map((gate) => gate.id)).toEqual(["needs-owner", "open-findings", "overdue-review"]);
    expect(gates[0]?.href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=no-owner`);
    expect(gates[1]?.href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);
    expect(gates[2]?.href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=overdue-review`);
  });

  it("suggests open findings when no pending owners", () => {
    const gates = resolveSecureNowFindingsQueueOpenGate("security", {
      isAssignedToMe: false,
      pendingOwner: 0,
      openRisks: 3,
      overdueReview: 0,
    });

    expect(gates.map((gate) => gate.id)).toEqual(["open-findings"]);
    expect(gates[0]?.href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);
  });

  it("returns no gates when the register is clear or counts are invalid", () => {
    expect(
      resolveSecureNowFindingsQueueOpenGate("security", {
        isAssignedToMe: false,
        pendingOwner: 0,
        openRisks: 0,
        overdueReview: 0,
      }),
    ).toEqual([]);
    expect(
      resolveSecureNowFindingsQueueOpenGate("security", {
        isAssignedToMe: false,
        pendingOwner: -1,
        openRisks: Number.NaN,
        overdueReview: Number.POSITIVE_INFINITY,
      }),
    ).toEqual([]);
  });
});
