import { describe, expect, it } from "vitest";

import {
  buildProductLinePlaygroundEnvSummary,
  countProductLineAssignmentOverrides,
  formatProductLinePlaygroundActiveShellLabel,
  formatProductLinePlaygroundBuildEnvLabel,
  formatProductLinePlaygroundCookieLabel,
  formatProductLinePlaygroundOverrideCountLabel,
} from "@/lib/product-line/product-line-playground-summary";

describe("product-line-playground-summary", () => {
  it("formats build env, cookie, active shell, and override count labels", () => {
    expect(formatProductLinePlaygroundBuildEnvLabel("security")).toBe(
      "Build env (NEXT_PUBLIC_ARCHLUCID_PRODUCT): Security",
    );
    expect(formatProductLinePlaygroundCookieLabel(null)).toBe("Cookie override: none (using build env)");
    expect(formatProductLinePlaygroundCookieLabel("architecture")).toBe("Cookie override: Architecture");
    expect(formatProductLinePlaygroundActiveShellLabel("security")).toBe("Active shell: Security");
    expect(formatProductLinePlaygroundOverrideCountLabel(0)).toBe("Href overrides: none (catalog defaults only)");
    expect(formatProductLinePlaygroundOverrideCountLabel(2)).toBe("Href overrides: 2 in localStorage");
  });

  it("builds a summary from env, cookie, active shell, and overrides", () => {
    const summary = buildProductLinePlaygroundEnvSummary({
      buildEnvProductLine: "security",
      cookieProductLine: "architecture",
      activeProductLine: "architecture",
      assignmentOverrides: { "/architecture/reviews": "security" },
    });

    expect(summary).toEqual({
      buildEnvProductLine: "security",
      cookieProductLine: "architecture",
      activeProductLine: "architecture",
      assignmentOverrideCount: 1,
    });
    expect(countProductLineAssignmentOverrides({ "/a": "both", "/b": "architecture" })).toBe(2);
  });
});
