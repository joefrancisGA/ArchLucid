import { describe, expect, it } from "vitest";

import { appendSecureNowFindingsQueueOpenGateScope } from "@/lib/product-line/securenow-findings-queue-open-gate-scope";
import { resolveSecureNowFindingsQueueOpenGate } from "@/lib/product-line/securenow-findings-queue-open-gate";
import { SECURENOW_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

describe("securenow-findings-queue-open-gate-scope", () => {
  it("appends runId and architectureId without dropping the filter", () => {
    expect(
      appendSecureNowFindingsQueueOpenGateScope(`${SECURENOW_FINDINGS_PATH}?filter=open`, {
        runId: "run-abc",
        architectureId: "arch-1",
      }),
    ).toBe(`${SECURENOW_FINDINGS_PATH}?filter=open&runId=run-abc&architectureId=arch-1`);
  });

  it("open gate href keeps scoped runId", () => {
    const gates = resolveSecureNowFindingsQueueOpenGate("security", {
      isAssignedToMe: false,
      pendingOwner: 0,
      openRisks: 1,
      overdueReview: 0,
      scopeParams: { runId: "run-xyz" },
    });

    expect(gates.find((gate) => gate.id === "open-findings")?.href).toBe(
      `${SECURENOW_FINDINGS_PATH}?filter=open&runId=run-xyz`,
    );
  });
});