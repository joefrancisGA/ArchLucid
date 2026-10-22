import { describe, expect, it } from "vitest";

import {
  workspaceModeGraduationOfferPanelsHrefFromSearch,
  workspaceModeGraduationOfferUrlAlreadyMatches,
} from "@/lib/operator/workspace-mode-graduation-offer-panels-url";

describe("workspace mode graduation offer URL", () => {
  it("treats a missing graduationOfferOpen param as already matching closed", () => {
    expect(workspaceModeGraduationOfferUrlAlreadyMatches("", false)).toBe(true);
    expect(workspaceModeGraduationOfferUrlAlreadyMatches("tab=all", false)).toBe(true);
    expect(workspaceModeGraduationOfferUrlAlreadyMatches("", true)).toBe(false);
  });

  it("treats graduationOfferOpen=1 as already matching open", () => {
    expect(workspaceModeGraduationOfferUrlAlreadyMatches("graduationOfferOpen=1", true)).toBe(true);
    expect(workspaceModeGraduationOfferUrlAlreadyMatches("graduationOfferOpen=1", false)).toBe(false);
  });

  it("builds a root href without a dangling question mark when closing", () => {
    expect(workspaceModeGraduationOfferPanelsHrefFromSearch("graduationOfferOpen=1", false, "/")).toBe("/");
  });
});
