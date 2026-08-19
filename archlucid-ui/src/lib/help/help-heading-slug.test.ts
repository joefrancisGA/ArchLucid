import { describe, expect, it } from "vitest";

import {
  createHelpHeadingSlugAllocator,
  resolveHelpHeadingId,
  slugifyHelpHeading,
  stripInlineMarkdownForDisplay,
} from "@/lib/help/help-heading-slug";

describe("help-heading-slug", () => {
  it("slugifyHelpHeading normalizes headings like the build-time index", () => {
    expect(slugifyHelpHeading("API startup failures")).toBe("api-startup-failures");
    expect(slugifyHelpHeading("**Bold** section")).toBe("bold-section");
  });

  it("stripInlineMarkdownForDisplay removes emphasis and code spans for TOC titles", () => {
    expect(stripInlineMarkdownForDisplay("**SQL connection string** failures")).toBe("SQL connection string failures");
    expect(stripInlineMarkdownForDisplay("`GET /health/ready`")).toBe("GET /health/ready");
    expect(stripInlineMarkdownForDisplay("Unbalanced **heading")).toBe("Unbalanced heading");
  });

  it("resolveHelpHeadingId keeps slug anchors stable while cleaning display titles", () => {
    const allocate = createHelpHeadingSlugAllocator();
    const resolved = resolveHelpHeadingId("**SQL connection string** checks", allocate);

    expect(resolved.id).toBe("sql-connection-string-checks");
    expect(resolved.title).toBe("SQL connection string checks");
    expect(resolved.title).not.toMatch(/[*_`]/);
  });

  it("createHelpHeadingSlugAllocator deduplicates like the index builder", () => {
    const allocate = createHelpHeadingSlugAllocator();

    expect(allocate("Overview")).toBe("overview");
    expect(allocate("Overview")).toBe("overview-2");
  });
});
