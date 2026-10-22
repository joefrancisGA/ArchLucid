import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_CLAIM_HEADING,
  DECISION_REGISTER_PAGE_SUBTITLE,
  DECISION_REGISTER_PAGE_SUBTITLE_BUYER,
  decisionRegisterPageSubtitle,
} from "./decision-register-copy";

describe("decision-register-copy buyer page chrome", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(decisionRegisterPageSubtitle(true)).toBe(DECISION_REGISTER_PAGE_SUBTITLE_BUYER);
    expect(decisionRegisterPageSubtitle(false)).toBe(DECISION_REGISTER_PAGE_SUBTITLE);
  });

  it("keeps claim heading register-first", () => {
    expect(DECISION_REGISTER_CLAIM_HEADING.toLowerCase()).toContain("register");
  });
});
