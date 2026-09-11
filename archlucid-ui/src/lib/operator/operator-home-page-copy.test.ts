import { describe, expect, it } from "vitest";

import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_WORKING_PAGE_SUBTITLE,
  operatorHomePageSubtitle,
} from "@/lib/operator/operator-home-page-copy";

describe("operator-home-page-copy", () => {
  it("uses architecture-specific resume wording in working mode", () => {
    expect(OPERATOR_HOME_WORKING_PAGE_SUBTITLE).toContain("Resume architecture drafts");
    expect(operatorHomePageSubtitle(false, true)).toBe(OPERATOR_HOME_WORKING_PAGE_SUBTITLE);
  });

  it("omits buyer home subtitle when buyer-polished shell is enabled", () => {
    expect(operatorHomePageSubtitle(true)).toBeUndefined();
    expect(operatorHomePageSubtitle(false)).toBe(OPERATOR_HOME_PAGE_SUBTITLE);
    expect(operatorHomePageSubtitle(false, true)).not.toBe(OPERATOR_HOME_PAGE_SUBTITLE);
    expect(BUYER_OPERATOR_HOME_PAGE_SUBTITLE).not.toBe(OPERATOR_HOME_PAGE_SUBTITLE);
  });
});
