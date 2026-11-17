import { describe, expect, it } from "vitest";

import { SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE } from "@/lib/product-line/securenow-investigation-effort-copy";
import {
  buildSecureNowSecondCaptureCloudConnectionsHref,
  buildSecureNowSecondCaptureExtractUploadHref,
  SECURENOW_RETURN_PATH_QUERY_PARAM,
} from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";
import { TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE } from "@/lib/infra-evidence/terraform-advisory-plan-output-not-apply-copy";
import { PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE } from "@/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy";

describe("score-lift round58 batch honesty", () => {
  it("second-capture extract upload carries return path", () => {
    const href = buildSecureNowSecondCaptureExtractUploadHref("/governance/remediation-factory");

    expect(href).toContain(SECURENOW_RETURN_PATH_QUERY_PARAM);
    expect(href).toContain("remediation-factory");
  });

  it("cloud connections return path builder unchanged", () => {
    const href = buildSecureNowSecondCaptureCloudConnectionsHref("/administration/securenow-pilot-decision");

    expect(href).toContain(SECURENOW_RETURN_PATH_QUERY_PARAM);
    expect(href).toContain("pilot-decision");
  });

  it("investigation effort, drift terraform, and scorecard quarterly copy", () => {
    expect(SECURENOW_INVESTIGATION_EFFORT_PARTIAL_CAPTURE_CONTEXT_LINE).toContain("partial");
    expect(TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE).toContain("terraform apply");
    expect(PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE).toContain("Quarterly");
  });
});