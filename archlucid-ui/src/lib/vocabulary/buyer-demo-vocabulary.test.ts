import { describe, expect, it } from "vitest";

import { applyBuyerDemoVocabulary } from "@/lib/vocabulary/buyer-demo-vocabulary";

describe("applyBuyerDemoVocabulary", () => {
  it("replaces engineering terms when active", () => {
    expect(applyBuyerDemoVocabulary("Open run manifest after commit", true)).toBe(
      "Open review signed package after finalize",
    );
  });

  it("leaves text unchanged when inactive", () => {
    expect(applyBuyerDemoVocabulary("Open run manifest after commit", false)).toBe(
      "Open run manifest after commit",
    );
  });

  it("defaults to active vocabulary pass in production shells (TB-645)", () => {
    expect(applyBuyerDemoVocabulary("Open run manifest after commit")).toBe(
      "Open review signed package after finalize",
    );
  });
});
