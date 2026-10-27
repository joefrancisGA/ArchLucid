import { describe, expect, it } from "vitest";

import {
  ACTION_ACTOR_UNAVAILABLE,
  formatActionActorName,
  GOVERNANCE_DECISION_OWNER_NAME_NOT_STORED,
  resolveGovernanceDecisionOwnerCell,
  resolveOperatorPrincipalOwnerLabel,
} from "@/lib/action-actor-display";

describe("resolveOperatorPrincipalOwnerLabel", () => {
  it("prefers principal name over JWT claims", () => {
    expect(
      resolveOperatorPrincipalOwnerLabel({
        name: "Taylor Morgan",
        meClaims: [{ type: "preferred_username", value: "taylor@example.com" }],
      }),
    ).toBe("Taylor Morgan");
  });

  it("falls back to preferred_username when name is missing", () => {
    expect(
      resolveOperatorPrincipalOwnerLabel({
        name: null,
        meClaims: [{ type: "preferred_username", value: "alex@example.com" }],
      }),
    ).toBe("alex@example.com");
  });

  it("returns null when no identity is available", () => {
    expect(resolveOperatorPrincipalOwnerLabel({ name: null, meClaims: [] })).toBeNull();
  });
});

describe("resolveGovernanceDecisionOwnerCell", () => {
  it("shows omission copy and user id when only a uuid owner is stored (P-13)", () => {
    const ownerId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const cell = resolveGovernanceDecisionOwnerCell(ownerId);

    expect(cell.nameLabel).toBe(GOVERNANCE_DECISION_OWNER_NAME_NOT_STORED);
    expect(cell.userId).toBe(ownerId);
  });

  it("keeps display names unchanged", () => {
    expect(resolveGovernanceDecisionOwnerCell("Jordan Lee")).toEqual({
      nameLabel: "Jordan Lee",
      userId: null,
    });
  });
});

describe("formatActionActorName", () => {
  it("returns trimmed user names unchanged", () => {
    expect(formatActionActorName("  Jordan Lee  ")).toBe("Jordan Lee");
    expect(formatActionActorName("api-user")).toBe("api-user");
  });

  it("returns omission copy for null, undefined, and blank values", () => {
    expect(formatActionActorName(null)).toBe(ACTION_ACTOR_UNAVAILABLE);
    expect(formatActionActorName(undefined)).toBe(ACTION_ACTOR_UNAVAILABLE);
    expect(formatActionActorName("")).toBe(ACTION_ACTOR_UNAVAILABLE);
    expect(formatActionActorName("   ")).toBe(ACTION_ACTOR_UNAVAILABLE);
  });
});
