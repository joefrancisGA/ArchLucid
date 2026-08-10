import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY,
  ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/create-vs-review-intake-copy";

describe("create-vs-review-intake-copy (TB-1459)", () => {
  it("discloses browser-local scope on create-path resume and empty guidance", () => {
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("this browser");
    expect(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY.toLowerCase()).toContain("not a tenant-wide");

    expect(ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE.toLowerCase()).toContain("this browser");
    expect(ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE.toLowerCase()).toContain("other browsers");
  });

  it("aligns view-all drafts label with architectures hub honesty", () => {
    expect(ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL.toLowerCase()).toContain("this browser");
  });
});
