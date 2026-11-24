import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowSecondCapturePathDeltaHonestyStrip } from "./SecureNowSecondCapturePathDeltaHonestyStrip";
import { SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE } from "@/lib/product-line/securenow-second-capture-delta-copy";
import { SECURENOW_STICKINESS_NOT_USAGE_CLAIM } from "@/lib/product-line/securenow-stickiness";

describe("SecureNowSecondCapturePathDeltaHonestyStrip", () => {
  it("renders path delta honesty, not-usage claim, and return-path recovery links", () => {
    render(
      <SecureNowSecondCapturePathDeltaHonestyStrip
        testId="strip"
        returnPath="/security/findings"
        middleLine="Middle."
        cloudConnectionsTestId="strip-cloud"
        extractUploadTestId="strip-extract"
      />,
    );

    expect(screen.getByTestId("strip-path-delta-line")).toHaveTextContent(SECURENOW_SECOND_CAPTURE_PATH_DELTA_LINE);
    expect(screen.getByTestId("strip-not-usage-claim")).toHaveTextContent(SECURENOW_STICKINESS_NOT_USAGE_CLAIM);
    expect(screen.getByTestId("strip-recovery")).toHaveTextContent("Middle.");
    expect(screen.getByTestId("strip-cloud")).toHaveAttribute("href", expect.stringContaining("securenowReturnPath"));
    expect(screen.getByTestId("strip-extract")).toHaveAttribute("href", expect.stringContaining("securenowReturnPath"));
  });
});
