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
  });
});
