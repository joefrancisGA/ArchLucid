import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { PATH_CHOOSER_HELP_SOURCES } from "@/lib/path-chooser-help-evidence-copy";

describe("path-chooser-help-evidence-copy", () => {
  it("excludes action-panel destinations from help Sources", () => {
    const sourceHrefs = PATH_CHOOSER_HELP_SOURCES.map((source) => source.href);

    expect(sourceHrefs).not.toContain("/architecture/reviews/new");
    expect(sourceHrefs).not.toContain(inAppHelpHref("security-trust"));
    expect(sourceHrefs).not.toContain(inAppHelpHref("first-architecture-review"));
    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(PATH_CHOOSER_HELP_SOURCES.length).toBeGreaterThan(0);
  });
});
