import { describe, expect, it } from "vitest";

import { ACTION_ACTOR_UNAVAILABLE, formatActionActorName } from "@/lib/action-actor-display";

describe("formatActionActorName", () => {
  it("returns trimmed user names unchanged", () => {
    expect(formatActionActorName("  Jordan Lee  ")).toBe("Jordan Lee");
    expect(formatActionActorName("api-user")).toBe("api-user");
  });

  it("returns N/A for null, undefined, and blank values", () => {
    expect(formatActionActorName(null)).toBe(ACTION_ACTOR_UNAVAILABLE);
    expect(formatActionActorName(undefined)).toBe(ACTION_ACTOR_UNAVAILABLE);
    expect(formatActionActorName("")).toBe(ACTION_ACTOR_UNAVAILABLE);
    expect(formatActionActorName("   ")).toBe(ACTION_ACTOR_UNAVAILABLE);
  });
});
