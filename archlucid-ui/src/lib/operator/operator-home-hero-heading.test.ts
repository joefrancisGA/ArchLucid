import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
  resolveOperatorHomeHeroHeading,
} from "@/lib/buyer/buyer-polish-copy";

describe("resolveOperatorHomeHeroHeading", () => {
  it("uses first-run intent chooser copy before the tenant has committed workspace activity", () => {
    expect(resolveOperatorHomeHeroHeading(false)).toBe(OPERATOR_HOME_INTENT_CHOOSER_HEADING);
  });

  it("uses workspace overview copy after committed workspace activity", () => {
    expect(resolveOperatorHomeHeroHeading(true)).toBe(OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING);
  });
});
