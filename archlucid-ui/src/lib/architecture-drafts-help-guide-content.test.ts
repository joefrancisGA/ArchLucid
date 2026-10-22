import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFTS_HELP_OVERVIEW,
  ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE,
} from "@/lib/architecture-drafts-help-guide-content";

describe("architecture-drafts-help-guide-content (CA-44)", () => {
  it("titles the help topic as architecture drafts, not the whole Architectures hub", () => {
    expect(ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE).toBe("Architecture drafts");
    expect(ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE).not.toBe("Architectures");
  });

  it("separates Working identity portfolio from Guided draft inventory in overview copy", () => {
    expect(ARCHITECTURE_DRAFTS_HELP_OVERVIEW.toLowerCase()).toContain("working mode");
    expect(ARCHITECTURE_DRAFTS_HELP_OVERVIEW.toLowerCase()).toContain("architecture identities");
    expect(ARCHITECTURE_DRAFTS_HELP_OVERVIEW.toLowerCase()).toContain("guided");
    expect(ARCHITECTURE_DRAFTS_HELP_OVERVIEW.toLowerCase()).not.toContain("architectures workspace is");
  });
});
