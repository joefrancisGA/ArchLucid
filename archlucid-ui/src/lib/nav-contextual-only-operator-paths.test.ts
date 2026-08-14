import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import {
  CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS,
  isContextualOnlyOperatorNavPath,
} from "@/lib/nav-contextual-only-operator-paths";

describe("nav-contextual-only-operator-paths (TB-2241)", () => {
  it("registers architecture intelligence as contextual-only", () => {
    expect(CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS).toEqual([ARCHITECTURE_INTELLIGENCE_PATH]);
    expect(isContextualOnlyOperatorNavPath(ARCHITECTURE_INTELLIGENCE_PATH)).toBe(true);
    expect(isContextualOnlyOperatorNavPath("/architecture/reviews")).toBe(false);
  });
});
