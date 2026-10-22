import { describe, expect, it } from "vitest";

import { stripRetiredDemoOrgBranding } from "@/lib/retired-demo-org-branding";

describe("stripRetiredDemoOrgBranding", () => {
  it("rewrites Contoso retail baseline seed titles", () => {
    expect(
      stripRetiredDemoOrgBranding("Demo — Contoso retail baseline manifest (trusted baseline seed)."),
    ).toBe("Demo — Retail baseline manifest (trusted baseline seed).");
  });

  it("returns empty string for nullish input", () => {
    expect(stripRetiredDemoOrgBranding(null)).toBe("");
    expect(stripRetiredDemoOrgBranding(undefined)).toBe("");
  });
});
