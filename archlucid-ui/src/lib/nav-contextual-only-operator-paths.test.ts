import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  contextualOnlyOperatorNavHrefsForCallerRank,
  CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS,
  isContextualOnlyOperatorNavPath,
  mergeContextualOnlyOperatorNavHrefsIntoVisibleSet,
} from "@/lib/nav-contextual-only-operator-paths";

describe("nav-contextual-only-operator-paths (TB-2241)", () => {
  it("registers architecture intelligence as contextual-only", () => {
    expect(CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS).toEqual([ARCHITECTURE_INTELLIGENCE_PATH]);
    expect(isContextualOnlyOperatorNavPath(ARCHITECTURE_INTELLIGENCE_PATH)).toBe(true);
    expect(isContextualOnlyOperatorNavPath("/architecture/reviews")).toBe(false);
  });

  it("exposes architecture intelligence to Execute+ callers for palette visibility", () => {
    expect(contextualOnlyOperatorNavHrefsForCallerRank(AUTHORITY_RANK.ReadAuthority)).toEqual([]);
    expect(contextualOnlyOperatorNavHrefsForCallerRank(AUTHORITY_RANK.ExecuteAuthority)).toEqual([
      ARCHITECTURE_INTELLIGENCE_PATH,
    ]);
  });

  it("merges contextual-only hrefs into a visible href set", () => {
    const merged = mergeContextualOnlyOperatorNavHrefsIntoVisibleSet(
      new Set(["/architecture/reviews"]),
      AUTHORITY_RANK.ExecuteAuthority,
    );

    expect(merged.has("/architecture/reviews")).toBe(true);
    expect(merged.has(ARCHITECTURE_INTELLIGENCE_PATH)).toBe(true);
  });
});
