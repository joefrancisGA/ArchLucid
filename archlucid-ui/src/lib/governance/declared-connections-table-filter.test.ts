import { describe, expect, it } from "vitest";

import { countDeclaredConnectionsByStatus } from "@/lib/governance/declared-connections-table-filter";
import type { SecurityDeclaredConnectionRow } from "@/lib/security-declared-connection-types";

const activeRow: SecurityDeclaredConnectionRow = {
  connectionId: "connection-1",
  fromCloudResourceId: "from-resource",
  toCloudResourceId: "to-resource",
  relationshipType: "ConnectsTo",
  rationale: "Connection evidence retained for review.",
  evidenceReference: null,
  expirationUtc: "2027-01-01T00:00:00Z",
  status: "Active",
  provenanceKind: "HumanAssertion",
  createdUtc: "2026-09-25T00:00:00Z",
  updatedUtc: "2026-09-25T00:00:00Z",
};

describe("declared-connections-table-filter", () => {
  it("counts every declared display status without treating the all filter as a row status", () => {
    expect(
      countDeclaredConnectionsByStatus([
        activeRow,
        { ...activeRow, connectionId: "connection-2", status: "Revoked" },
      ]),
    ).toMatchObject({
      all: 2,
      Active: 1,
      Revoked: 1,
    });
  });
});
