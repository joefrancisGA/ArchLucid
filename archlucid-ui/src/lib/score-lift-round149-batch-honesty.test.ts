import { describe, expect, it } from "vitest";

import { SECURENOW_TIME_TO_VALUE_NEEDS_COLLECTION_LEAD } from "@/lib/product-line/securenow-time-to-value-next-step-copy";
import { SECURENOW_TIME_TO_VALUE_NOT_SLA_LINE } from "@/lib/product-line/securenow-time-to-value-next-step-copy";
import { GOVERNANCE_FINDINGS_QUEUE_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/governance/governance-findings-queue-second-capture-path-delta-copy";

describe("score lift round149 wave H1 honesty", () => {
  it("does not promise value before capture or imply SLA usage scores", () => {
    expect(SECURENOW_TIME_TO_VALUE_NEEDS_COLLECTION_LEAD).toContain("Reader capture");
    expect(SECURENOW_TIME_TO_VALUE_NOT_SLA_LINE).toContain("not a timed SLA");
    expect(SECURENOW_TIME_TO_VALUE_NOT_SLA_LINE).toContain("usage score");
    expect(GOVERNANCE_FINDINGS_QUEUE_SECOND_CAPTURE_PATH_DELTA_LINE).toContain("second capture");
  });
});
