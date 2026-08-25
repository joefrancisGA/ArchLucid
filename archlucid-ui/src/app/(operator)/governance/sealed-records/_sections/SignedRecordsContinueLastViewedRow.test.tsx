import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignedRecordsContinueLastViewedRow } from "./SignedRecordsContinueLastViewedRow";

describe("SignedRecordsContinueLastViewedRow", () => {
  it("renders continue row with open link", () => {
    render(
      <SignedRecordsContinueLastViewedRow
        row={{
          runId: "run-1",
          reviewTitle: "Platform review",
          committedUtc: "2026-01-01T00:00:00Z",
          manifestVersion: "v1",
          manifestId: "manifest-1",
          reviewHref: "/architecture/reviews/run-1",
          signedRecordHref: "/governance/sealed-records/manifest-1",
          sealIntegrity: null,
          sealDigestTruncated: null,
          sealDigestFull: null,
          recordLookupFailure: null,
        }}
      />,
    );

    expect(screen.getByTestId("signed-records-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("signed-records-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/governance/sealed-records/manifest-1",
    );
  });
});
