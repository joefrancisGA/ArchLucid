import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureReviewNewSealedPackageCallout } from "./ArchitectureReviewNewSealedPackageCallout";

describe("ArchitectureReviewNewSealedPackageCallout", () => {
  it("states that starting a review is not a sealed package", () => {
    render(<ArchitectureReviewNewSealedPackageCallout />);

    expect(screen.getByTestId("architecture-review-new-sealed-package-callout")).toHaveTextContent(/sealed evaluation package/i);
  });
});
