import { describe, expect, it } from "vitest";

import {
  countActiveDeclaredConnections,
  isExpirationUtcInFuture,
  resolveDeclaredConnectionDisplayStatus,
} from "@/lib/governance/declared-connections-status";
import type { SecurityDeclaredConnectionRow } from "@/lib/security-declared-connection-types";

const baseRow: SecurityDeclaredConnectionRow = {
  connectionId: "id-1",
  fromCloudResourceId: "from",
  toCloudResourceId: "to",
  relationshipType: "ConnectsTo",
  rationale: "test rationale long enough",
  evidenceReference: null,
  expirationUtc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  status: "Active",
  provenanceKind: "HumanAssertion",
  createdUtc: "2026-01-01T00:00:00Z",
  updatedUtc: "2026-01-01T00:00:00Z",
};

describe("declared-connections-status", () => {
  it("marks active rows near expiry", () => {
    const nearExpiryRow = {
      ...baseRow,
      expirationUtc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(resolveDeclaredConnectionDisplayStatus(nearExpiryRow)).toBe("NearExpiry");
  });

  it("counts only active rows", () => {
    expect(
      countActiveDeclaredConnections([
        baseRow,
        { ...baseRow, connectionId: "id-2", status: "Revoked" },
      ]),
    ).toBe(1);
  });

  it("rejects past expiration values", () => {
    expect(isExpirationUtcInFuture("2020-01-01T00:00:00Z")).toBe(false);
  });
});
