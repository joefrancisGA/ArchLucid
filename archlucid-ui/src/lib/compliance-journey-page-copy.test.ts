import { describe, expect, it } from "vitest";

import {
  COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID,
  COMPLIANCE_JOURNEY_PAGE_TITLE,
  COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID,
  COMPLIANCE_JOURNEY_SKIP_TARGET_ID,
} from "@/lib/compliance-journey-page-copy";

describe("compliance-journey-page-copy", () => {
  it("keeps skip target aligned with the first-viewport band", () => {
    expect(COMPLIANCE_JOURNEY_PAGE_TITLE).toBe("Compliance journey");
    expect(COMPLIANCE_JOURNEY_PRIMARY_CONTENT_ID).toBe("compliance-journey-primary-content");
    expect(COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID).toBe("compliance-journey-first-viewport");
    expect(COMPLIANCE_JOURNEY_SKIP_TARGET_ID).toBe(COMPLIANCE_JOURNEY_FIRST_VIEWPORT_ID);
  });
});
