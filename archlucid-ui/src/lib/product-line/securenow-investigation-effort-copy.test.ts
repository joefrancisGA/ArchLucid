import { describe, expect, it } from "vitest";

import { formatSecureNowInvestigationEffortBlockingBanner } from "./securenow-investigation-effort-blocking-banner-copy";
import {
  SECURENOW_INVESTIGATION_EFFORT_LEAD,
  SECURENOW_INVESTIGATION_EFFORT_NO_CAPTURE_LINE,
  SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE,
  SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_RESULT,
} from "./securenow-investigation-effort-copy";
import { formatSecureNowInvestigationEffortMissingFieldsReason } from "./securenow-investigation-effort-missing-fields";

describe("investigation effort copy", () => {
  it("does not say zero after-product hours leaves ROI uncalculated", () => {
    expect(SECURENOW_INVESTIGATION_EFFORT_LEAD).toMatch(/after-product hours may be zero/i);
    expect(SECURENOW_INVESTIGATION_EFFORT_LEAD).not.toMatch(/all five inputs are positive/);
    expect(SECURENOW_INVESTIGATION_EFFORT_SYNTHETIC_EXAMPLE_RESULT).not.toMatch(/five positive values/);
    expect(formatSecureNowInvestigationEffortMissingFieldsReason([])).not.toMatch(/positive numbers/);
    expect(formatSecureNowInvestigationEffortBlockingBanner("")).not.toMatch(/positive numbers/);
  });

  it("asks for hours because ROI multiplies the hour delta by the hourly rate", () => {
    expect(SECURENOW_INVESTIGATION_EFFORT_LEAD).not.toMatch(/\bminutes\b/i);
    expect(SECURENOW_INVESTIGATION_EFFORT_LEAD).toMatch(/\bhours\b/i);
    expect(SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE).not.toMatch(/\bminutes\b/i);
    expect(SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE).toMatch(/\bhours\b/i);
    expect(SECURENOW_INVESTIGATION_EFFORT_NO_CAPTURE_LINE).not.toMatch(/\bminutes\b/i);
    expect(SECURENOW_INVESTIGATION_EFFORT_NO_CAPTURE_LINE).toMatch(/\bhours\b/i);
  });
});