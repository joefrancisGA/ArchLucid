import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING,
  ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER,
  architectureDraftDetailPageSubtitle,
} from "@/lib/architecture/architecture-draft-detail-page-copy";
import { ARCHITECTURE_DRAFT_WORKSPACE_LEAD } from "@/lib/create-vs-review-intake-copy";

describe("architecture-draft-detail-page-copy", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(architectureDraftDetailPageSubtitle(true)).toBe(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER);
    expect(architectureDraftDetailPageSubtitle(false)).toBe(ARCHITECTURE_DRAFT_WORKSPACE_LEAD);
  });

  it("keeps claim heading drafting-first", () => {
    expect(ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING.toLowerCase()).toContain("draft");
  });
});
