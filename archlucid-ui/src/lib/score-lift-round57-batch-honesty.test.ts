import { describe, expect, it } from "vitest";

import {
  PILOT_SCORECARD_OPERATIONAL_METRIC_ROI_NON_SUMMING_LINE,
  PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE,
} from "@/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy";
import {
  buildSecureNowSecondCaptureCloudConnectionsHref,
  SECURENOW_RETURN_PATH_QUERY_PARAM,
} from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";

describe("score-lift round57 batch honesty", () => {
  it("scorecard operational and quarterly non-summing copy", () => {
    expect(PILOT_SCORECARD_OPERATIONAL_METRIC_ROI_NON_SUMMING_LINE).toContain("not additive");
    expect(PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE).toContain("Quarterly");
  });

  it("return path href for partial-capture surfaces", () => {
    const href = buildSecureNowSecondCaptureCloudConnectionsHref("/governance/findings");

    expect(href).toContain(SECURENOW_RETURN_PATH_QUERY_PARAM);
    expect(href).toContain("findings");
  });
});