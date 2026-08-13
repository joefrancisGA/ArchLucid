import { describe, expect, it } from "vitest";

import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_PAGE_SUBTITLE,
  operatorHomePageSubtitle,
} from "@/lib/operator/operator-home-page-copy";

describe("operator-home-page-copy", () => {
  it("uses shorter buyer home subtitle", () => {
    expect(operatorHomePageSubtitle(true)).toBe(BUYER_OPERATOR_HOME_PAGE_SUBTITLE);
    expect(operatorHomePageSubtitle(false)).toBe(OPERATOR_HOME_PAGE_SUBTITLE);
    expect(BUYER_OPERATOR_HOME_PAGE_SUBTITLE.length).toBeLessThan(OPERATOR_HOME_PAGE_SUBTITLE.length);
  });
});
