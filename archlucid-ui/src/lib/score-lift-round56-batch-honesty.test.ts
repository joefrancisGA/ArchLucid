import { describe, expect, it } from "vitest";

import { ITSM_OUTBOUND_CREATE_SUBMIT_DISCIPLINE_LINE } from "@/lib/itsm/itsm-outbound-create-submit-honesty-copy";
import { CLOUD_CONNECTIONS_RETURN_PATH_HONESTY_LINE } from "@/lib/integrations/cloud-connections-return-path-honesty-copy";
import { PILOT_SCORECARD_HEADLINE_BAND_ROI_NON_SUMMING_LINE } from "@/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy";
import { buildSecureNowSecondCaptureCloudConnectionsHref } from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";

describe("score-lift round56 batch honesty", () => {
  it("pilot scorecard headline bands and ITSM confirm discipline", () => {
    expect(PILOT_SCORECARD_HEADLINE_BAND_ROI_NON_SUMMING_LINE).toContain("not additive");
    expect(ITSM_OUTBOUND_CREATE_SUBMIT_DISCIPLINE_LINE).toContain("confirm");
  });

  it("partial capture return path href and cloud connections honesty", () => {
    const href = buildSecureNowSecondCaptureCloudConnectionsHref("/governance/remediation-factory");

    expect(href).toContain("securenowReturnPath");
    expect(CLOUD_CONNECTIONS_RETURN_PATH_HONESTY_LINE).toContain("Return to prior page");
  });
});