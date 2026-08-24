import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_HUB_EMPTY_BODY,
  ARCHITECTURES_HUB_EMPTY_FILTER_BODY,
  ARCHITECTURES_HUB_EMPTY_FILTER_TITLE,
  ARCHITECTURES_HUB_EMPTY_TITLE,
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
  ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER,
  ARCHITECTURES_HUB_PAGE_TITLE,
  architecturesHubPageSubtitle,
} from "@/lib/architectures-hub-copy";

describe("architectures-hub-copy", () => {
  it("teaches draft inventory honesty in page title and subtitle", () => {
    expect(ARCHITECTURES_HUB_PAGE_TITLE).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(ARCHITECTURES_HUB_PAGE_TITLE.toLowerCase()).toContain("draft");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("draft");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("account");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("sync");
  });

  it("keeps empty-state copy action-oriented without repeating scope prose", () => {
    expect(ARCHITECTURES_HUB_EMPTY_BODY.toLowerCase()).toContain("create");
    expect(ARCHITECTURES_HUB_EMPTY_BODY.toLowerCase()).not.toContain("other browsers");
    expect(ARCHITECTURES_HUB_EMPTY_FILTER_TITLE).toBeTruthy();
    expect(ARCHITECTURES_HUB_EMPTY_FILTER_BODY).toBeTruthy();
    expect(ARCHITECTURES_HUB_EMPTY_TITLE.toLowerCase()).toContain("draft");
  });

  it("uses buyer and operator hub subtitles with account-backed drafts", () => {
    expect(architecturesHubPageSubtitle(true)).toBe(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER);
    expect(architecturesHubPageSubtitle(false)).toBe(ARCHITECTURES_HUB_PAGE_SUBTITLE);
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER.toLowerCase()).toContain("account");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("sync");
  });
});
