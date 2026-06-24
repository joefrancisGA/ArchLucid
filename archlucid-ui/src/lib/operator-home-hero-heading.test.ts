import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
  PILOT_COMMAND_CENTER_HEADING,
  resolveOperatorHomeHeroHeading,
} from "@/lib/buyer-polish-copy";

describe("resolveOperatorHomeHeroHeading", () => {
  it("uses first-review copy before the tenant has committed workspace activity", () => {
    expect(resolveOperatorHomeHeroHeading(false)).toBe(PILOT_COMMAND_CENTER_HEADING);
  });

  it("uses workspace overview copy after committed workspace activity", () => {
    expect(resolveOperatorHomeHeroHeading(true)).toBe(OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING);
  });
});
