import { describe, expect, it } from "vitest";

import { createHelpHeadingSlugAllocator, slugifyHelpHeading } from "@/lib/help-heading-slug";

describe("help-heading-slug", () => {
  it("slugifyHelpHeading normalizes headings like the build-time index", () => {
    expect(slugifyHelpHeading("API startup failures")).toBe("api-startup-failures");
    expect(slugifyHelpHeading("**Bold** section")).toBe("bold-section");
  });

  it("createHelpHeadingSlugAllocator deduplicates like the index builder", () => {
    const allocate = createHelpHeadingSlugAllocator();

    expect(allocate("Overview")).toBe("overview");
    expect(allocate("Overview")).toBe("overview-2");
  });
});
