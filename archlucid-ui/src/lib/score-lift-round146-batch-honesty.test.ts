import { describe, expect, it } from "vitest";

import { SECURENOW_BILLING_COMPARISON_LEAD } from "@/lib/product-line/securenow-billing-plan-comparison-copy";
import { SECURENOW_PILOT_DECISION_IN_PROGRESS_LEAD } from "@/lib/product-line/securenow-pilot-decision-in-progress-cta-copy";
import { SECURENOW_QUOTE_PACKET_METER_TABLE_FOOTNOTE } from "@/lib/product-line/securenow-quote-packet-meter-table-footnote-copy";

describe("score lift round146 wave E honesty", () => {
  it("does not imply published fee schedules or commerce authorization", () => {
    expect(SECURENOW_QUOTE_PACKET_METER_TABLE_FOOTNOTE).toContain("not a published fee schedule");
    expect(SECURENOW_PILOT_DECISION_IN_PROGRESS_LEAD).toContain("does not authorize commerce");
    expect(SECURENOW_BILLING_COMPARISON_LEAD).toContain("does not include SecureNow");
  });
});
