import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SECURENOW_RETURN_PATH_QUERY_PARAM } from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";

import { SecureNowPartialCaptureRecoveryLinks } from "./SecureNowPartialCaptureRecoveryLinks";

describe("SecureNowPartialCaptureRecoveryLinks", () => {
  it("renders return path on cloud and extract links", () => {
    render(
      <SecureNowPartialCaptureRecoveryLinks
        partialCaptureSnapshotId="snap-1"
        returnPath="/governance/findings"
        cloudConnectionsTestId="test-cloud"
        extractUploadTestId="test-extract"
      />,
    );

    expect(screen.getByTestId("test-cloud")).toHaveAttribute(
      "href",
      expect.stringContaining(SECURENOW_RETURN_PATH_QUERY_PARAM),
    );
    expect(screen.getByTestId("test-extract")).toHaveAttribute(
      "href",
      expect.stringContaining("findings"),
    );
    expect(screen.getByText(/snap-1/)).toBeInTheDocument();
  });
});