import { describe, expect, it } from "vitest";

import {
  ASSURANCE_STATUS_HERO_SUPPORTING,
  ASSURANCE_STATUS_PAGE_TITLE,
  ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
} from "@/lib/marketing/assurance-status-page-copy";
import { assuranceStatusHeroSupporting } from "@/lib/security-trust-product-copy";

describe("assurance-status-page-copy", () => {
  it("uses product-line hero supporting copy for architecture default export", () => {
    expect(ASSURANCE_STATUS_PAGE_TITLE).toBe("Assurance status");
    expect(ASSURANCE_STATUS_PRIMARY_CONTENT_ID).toBe("assurance-status-primary-content");
    expect(ASSURANCE_STATUS_HERO_SUPPORTING).toBe(assuranceStatusHeroSupporting("architecture"));
    expect(assuranceStatusHeroSupporting("security")).toContain("SecureNow");
  });
});
