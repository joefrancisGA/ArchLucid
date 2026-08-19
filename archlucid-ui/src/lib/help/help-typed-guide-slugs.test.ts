import { describe, expect, it } from "vitest";

import { isTypedHelpGuideSlug } from "@/lib/help/help-typed-guide-slugs";

describe("help-typed-guide-slugs", () => {
  it("treats getting-started as a typed guide (architecture draft help button)", () => {
    expect(isTypedHelpGuideSlug("getting-started")).toBe(true);
    expect(isTypedHelpGuideSlug(" Getting-Started ")).toBe(true);
  });

  it("requires markdown for ordinary registry topics", () => {
    expect(isTypedHelpGuideSlug("faq")).toBe(false);
    expect(isTypedHelpGuideSlug("review-guide")).toBe(false);
  });
});
