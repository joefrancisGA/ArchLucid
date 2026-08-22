import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManifestDetailClaimOrientationStrip } from "./ManifestDetailClaimOrientationStrip";

describe("ManifestDetailClaimOrientationStrip", () => {
  it("renders follow-up Sources without restating package scope", () => {
    render(<ManifestDetailClaimOrientationStrip />);

    expect(screen.queryByTestId("sealed-record-detail-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "What this finalized review record is not" })).not.toBeInTheDocument();
    expect(screen.getByTestId("sealed-record-detail-sources")).toBeInTheDocument();
  });
});
