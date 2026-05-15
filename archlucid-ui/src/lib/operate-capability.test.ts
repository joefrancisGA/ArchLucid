import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { operateCapabilityFromRank } from "@/lib/operate-capability";

describe("operateCapabilityFromRank", () => {
  it("returns false for read rank", () => {
    expect(operateCapabilityFromRank(AUTHORITY_RANK.ReadAuthority)).toBe(false);
  });

  it("returns true for execute and admin ranks", () => {
    expect(operateCapabilityFromRank(AUTHORITY_RANK.ExecuteAuthority)).toBe(true);
    expect(operateCapabilityFromRank(AUTHORITY_RANK.AdminAuthority)).toBe(true);
  });

  /** Matches conservative nav / LayerHeader branch: unset sub-Read rank must not soft-enable mutations. */
  it("returns false for numeric rank below Read policy floor", () => {
    expect(operateCapabilityFromRank(0)).toBe(false);
  });
});
