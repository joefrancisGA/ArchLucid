import { describe, expect, it } from "vitest";

import { RISK_EXCEPTIONS_PAGE_SUBTITLE } from "@/lib/risk-exceptions-page";

import {
  RISK_EXCEPTIONS_CLAIM_HEADING,
  RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER,
  riskExceptionsPageSubtitle,
} from "./risk-exceptions-page-copy";

describe("risk-exceptions-page-copy buyer page chrome", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(riskExceptionsPageSubtitle(true)).toBe(RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER);
    expect(riskExceptionsPageSubtitle(false)).toBe(RISK_EXCEPTIONS_PAGE_SUBTITLE);
  });

  it("keeps claim heading register-first", () => {
    expect(RISK_EXCEPTIONS_CLAIM_HEADING.toLowerCase()).toContain("register");
  });
});
