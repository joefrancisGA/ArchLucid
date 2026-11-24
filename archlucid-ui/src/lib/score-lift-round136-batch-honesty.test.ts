import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_QUEUE_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/governance/governance-findings-queue-second-capture-path-delta-copy";
import { DRIFT_WORKBENCH_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/infra-evidence/drift-workbench-second-capture-path-delta-copy";
import { SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/product-line/securenow-second-capture-delta-copy";

describe("score lift round136 batch honesty", () => {
  it("names second capture before path-id stickiness", () => {
    expect(SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE).toContain("second successful capture");
    expect(GOVERNANCE_FINDINGS_QUEUE_SECOND_CAPTURE_PATH_DELTA_LINE).toContain("second capture");
    expect(DRIFT_WORKBENCH_SECOND_CAPTURE_PATH_DELTA_LINE).toContain("second successful capture");
  });
});
