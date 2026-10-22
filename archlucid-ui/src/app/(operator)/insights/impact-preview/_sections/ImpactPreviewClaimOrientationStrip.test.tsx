import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpactPreviewClaimOrientationStrip } from "./ImpactPreviewClaimOrientationStrip";

describe("ImpactPreviewClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<ImpactPreviewClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-sources")).toBeInTheDocument();
  });
});
