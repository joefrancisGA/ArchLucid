import { describe, expect, it } from "vitest";

import {
  ASSURANCE_STATUS_HERO_SUPPORTING,
  ASSURANCE_STATUS_PAGE_TITLE,
  ASSURANCE_STATUS_PRIMARY_CONTENT_ID,
} from "@/lib/marketing/assurance-status-page-copy";
import { SECURITY_TRUST_HERO_SUPPORTING } from "@/lib/security-trust-content";

describe("assurance-status-page-copy", () => {
  it("uses shorter buyer hero supporting copy", () => {
    expect(ASSURANCE_STATUS_PAGE_TITLE).toBe("Assurance status");
    expect(ASSURANCE_STATUS_PRIMARY_CONTENT_ID).toBe("assurance-status-primary-content");
    expect(ASSURANCE_STATUS_HERO_SUPPORTING.length).toBeLessThan(SECURITY_TRUST_HERO_SUPPORTING.length);
  });
});
