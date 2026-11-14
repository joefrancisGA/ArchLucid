import { describe, expect, it } from "vitest";

import { SECURENOW_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveSecureNowFindingsQueueOpenGate } from "@/lib/product-line/securenow-findings-queue-open-gate";

describe("securenow-findings-queue-open-gate", () => {
  it("prefers needs-owner before open findings", () => {
    const gate = resolveSecureNowFindingsQueueOpenGate("security", {
      isAssignedToMe: false,
      pendingOwner: 2,
      openRisks: 5,
      overdueReview: 1,
    });

    expect(gate?.id).toBe("needs-owner");
    expect(gate?.href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=no-owner`);
  });

  it("suggests open findings when no pending owners", () => {
    const gate = resolveSecureNowFindingsQueueOpenGate("security", {
      isAssignedToMe: false,
      pendingOwner: 0,
      openRisks: 3,
      overdueReview: 0,
    });

    expect(gate?.id).toBe("open-findings");
    expect(gate?.href).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open`);
  });

  it("returns null when the register is clear", () => {
    expect(
      resolveSecureNowFindingsQueueOpenGate("security", {
        isAssignedToMe: false,
        pendingOwner: 0,
        openRisks: 0,
        overdueReview: 0,
      }),
    ).toBeNull();
  });
});
