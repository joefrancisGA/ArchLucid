import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_NEW_CLAIM_HEADING,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
  architecturesNewPageSubtitle,
  architecturesNewWorkspaceLead,
} from "@/lib/architectures-new-page-copy";
import {
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
} from "@/lib/create-vs-review-intake-copy";

describe("architectures-new-page-copy", () => {
  it("uses buyer page subtitles only in polished shell", () => {
    expect(architecturesNewPageSubtitle(true, false)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER);
    expect(architecturesNewPageSubtitle(false, false)).toBe(ARCHITECTURE_CREATION_PAGE_SUBTITLE);
  });

  it("uses buyer workspace lead only in polished shell", () => {
    expect(architecturesNewWorkspaceLead(true, false)).toContain("first save");
    expect(architecturesNewWorkspaceLead(false, false)).toBe(ARCHITECTURE_DRAFT_WORKSPACE_LEAD);
  });

  it("keeps claim heading bootstrap-first", () => {
    expect(ARCHITECTURES_NEW_CLAIM_HEADING.toLowerCase()).toContain("bootstrap");
  });
});
