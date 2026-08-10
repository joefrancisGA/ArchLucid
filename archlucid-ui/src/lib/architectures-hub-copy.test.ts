import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture-workflow-labels";
import {
  ARCHITECTURES_HUB_EMPTY_BODY,
  ARCHITECTURES_HUB_EMPTY_FILTER_BODY,
  ARCHITECTURES_HUB_EMPTY_FILTER_TITLE,
  ARCHITECTURES_HUB_EMPTY_TITLE,
  ARCHITECTURES_HUB_LIST_SCOPE_NOTE,
  ARCHITECTURES_HUB_PAGE_SUBTITLE,
  ARCHITECTURES_HUB_PAGE_TITLE,
} from "@/lib/architectures-hub-copy";

describe("architectures-hub-copy", () => {
  it("teaches draft inventory honesty in page title and subtitle", () => {
    expect(ARCHITECTURES_HUB_PAGE_TITLE).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(ARCHITECTURES_HUB_PAGE_TITLE.toLowerCase()).toContain("draft");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("draft");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("this browser");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("not a tenant-wide");
    expect(ARCHITECTURES_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("review package");
  });

  it("discloses browser-local registry scope in list and empty copy", () => {
    expect(ARCHITECTURES_HUB_LIST_SCOPE_NOTE.toLowerCase()).toContain("this browser");
    expect(ARCHITECTURES_HUB_EMPTY_BODY.toLowerCase()).toContain("this browser");
    expect(ARCHITECTURES_HUB_EMPTY_BODY.toLowerCase()).toContain("other browsers");
  });
});
