import { describe, expect, it } from "vitest";

import {
  DIGEST_SPONSOR_FIRST_VIEWPORT_ID,
  DIGEST_SPONSOR_OVERVIEW_TITLE,
  DIGEST_SPONSOR_PRIMARY_CONTENT_ID,
  DIGEST_SPONSOR_SKIP_TARGET_ID,
} from "@/lib/marketing/digest-sponsor-page-copy";

describe("digest-sponsor-page-copy", () => {
  it("keeps skip target aligned with the first-viewport band", () => {
    expect(DIGEST_SPONSOR_OVERVIEW_TITLE).toBe("Sponsor digest overview");
    expect(DIGEST_SPONSOR_PRIMARY_CONTENT_ID).toBe("digest-sponsor-primary-content");
    expect(DIGEST_SPONSOR_FIRST_VIEWPORT_ID).toBe("digest-sponsor-first-viewport");
    expect(DIGEST_SPONSOR_SKIP_TARGET_ID).toBe(DIGEST_SPONSOR_FIRST_VIEWPORT_ID);
  });
});
