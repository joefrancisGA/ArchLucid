import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManifestDetailClaimOrientationStrip } from "./ManifestDetailClaimOrientationStrip";

describe("ManifestDetailClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<ManifestDetailClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("sealed-record-detail-sources")).toBeInTheDocument();
  });
});
