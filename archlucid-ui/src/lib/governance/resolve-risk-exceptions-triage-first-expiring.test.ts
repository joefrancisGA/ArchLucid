import { describe, expect, it } from "vitest";

import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import { resolveRiskExceptionsTriageFirstExpiring } from "@/lib/governance/resolve-risk-exceptions-triage-first-expiring";

const baseRecord = (overrides: Partial<RiskExceptionRecord>): RiskExceptionRecord => ({
  riskExceptionId: "exc-1",
  findingId: "finding-1",
  ownerUserId: "owner@contoso.com",
  rationale: "Temporary waiver",
  expiresAtUtc: "2026-12-01T00:00:00.000Z",
  status: "Active",
  ...overrides,
});

describe("resolveRiskExceptionsTriageFirstExpiring", () => {
  it("returns the open waiver that expires soonest", () => {
    const nowMs = Date.parse("2026-08-01T00:00:00.000Z");
    const target = resolveRiskExceptionsTriageFirstExpiring(
      [
        baseRecord({ riskExceptionId: "later", expiresAtUtc: "2026-11-01T00:00:00.000Z" }),
        baseRecord({ riskExceptionId: "soonest", findingId: "finding-soon", expiresAtUtc: "2026-08-15T00:00:00.000Z" }),
      ],
      nowMs,
    );

    expect(target?.riskExceptionId).toBe("soonest");
    expect(target?.findingId).toBe("finding-soon");
  });

  it("ignores revoked and expired waivers", () => {
    const nowMs = Date.parse("2026-08-01T00:00:00.000Z");
    const target = resolveRiskExceptionsTriageFirstExpiring(
      [
        baseRecord({ riskExceptionId: "revoked", status: "Revoked" }),
        baseRecord({ riskExceptionId: "expired", expiresAtUtc: "2026-01-01T00:00:00.000Z" }),
        baseRecord({ riskExceptionId: "open", expiresAtUtc: "2026-09-01T00:00:00.000Z" }),
      ],
      nowMs,
    );

    expect(target?.riskExceptionId).toBe("open");
  });
});
