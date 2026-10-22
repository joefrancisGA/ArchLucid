import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

import { resolveGovernanceQueueDueDate } from "./governance-queue-due-date";

function createRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Review",
    manifestId: "manifest-1",
    findingId: "finding-1",
    title: "Finding",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Remediate",
    recordKind: "finding",
    ...overrides,
  };
}

describe("resolveGovernanceQueueDueDate", () => {
  it("returns missing when neither due-date field contains a value", () => {
    expect(resolveGovernanceQueueDueDate(createRow())).toEqual({ kind: "missing" });
  });

  it("uses waiver expiry when revisit due date is empty", () => {
    expect(
      resolveGovernanceQueueDueDate(
        createRow({
          revisitDueUtc: "  ",
          waiverExpiresAtUtc: "2026-08-01T00:00:00.000Z",
        }),
      ),
    ).toEqual({ kind: "valid", utc: "2026-08-01T00:00:00.000Z" });
  });

  it("returns invalid for a non-empty unreadable stored value", () => {
    expect(resolveGovernanceQueueDueDate(createRow({ revisitDueUtc: "not-a-date" }))).toEqual({
      kind: "invalid",
      raw: "not-a-date",
    });
  });

  it("prefers a valid revisit due date over waiver expiry", () => {
    expect(
      resolveGovernanceQueueDueDate(
        createRow({
          revisitDueUtc: "2026-09-01T00:00:00.000Z",
          waiverExpiresAtUtc: "2026-08-01T00:00:00.000Z",
        }),
      ),
    ).toEqual({ kind: "valid", utc: "2026-09-01T00:00:00.000Z" });
  });
});
