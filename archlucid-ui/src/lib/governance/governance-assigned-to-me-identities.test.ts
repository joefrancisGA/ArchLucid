import { describe, expect, it } from "vitest";

import {
  architectureRiskRegisterEntryMatchesAssigneeIdentities,
  resolveGovernanceAssignedToMeIdentities,
} from "@/lib/governance/governance-assigned-to-me-identities";

describe("governance-assigned-to-me-identities", () => {
  it("resolves mailbox-style principal names for assignment matching", () => {
    expect(resolveGovernanceAssignedToMeIdentities({ name: "Jordan Lee" })).toEqual(["Jordan Lee"]);
    expect(resolveGovernanceAssignedToMeIdentities({ name: "  " })).toEqual([]);
  });

  it("collects mailbox, actor, and jwt actor id like the server resolver", () => {
    const identities = resolveGovernanceAssignedToMeIdentities({
      name: "Jordan Lee",
      meClaims: [
        { type: "email", value: "jordan@example.com" },
        { type: "oid", value: "actor-guid-123" },
      ],
    });

    expect(identities).toEqual(
      expect.arrayContaining(["jordan@example.com", "Jordan Lee", "jwt:actor-guid-123"]),
    );
    expect(identities).toHaveLength(3);
  });

  it("omits api-user actor label while keeping jwt actor id", () => {
    expect(
      resolveGovernanceAssignedToMeIdentities({
        name: "api-user",
        meClaims: [{ type: "oid", value: "service-principal-id" }],
      }),
    ).toEqual(["jwt:service-principal-id"]);
  });

  it("matches assigned or owner fields case-insensitively", () => {
    expect(
      architectureRiskRegisterEntryMatchesAssigneeIdentities(
        { assignedToUserId: "Owner@Example.com" },
        ["owner@example.com"],
      ),
    ).toBe(true);

    expect(
      architectureRiskRegisterEntryMatchesAssigneeIdentities(
        { ownerUserId: "owner@example.com" },
        ["other@example.com"],
      ),
    ).toBe(false);

    expect(
      architectureRiskRegisterEntryMatchesAssigneeIdentities(
        { assignedToUserId: "jwt:actor-guid-123" },
        ["jwt:actor-guid-123"],
      ),
    ).toBe(true);
  });
});
