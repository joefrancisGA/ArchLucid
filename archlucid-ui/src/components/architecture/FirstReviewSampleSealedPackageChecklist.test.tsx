import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_HEADING } from "@/lib/first-review-sample-sealed-package-copy";

import { FirstReviewSampleSealedPackageChecklist } from "./FirstReviewSampleSealedPackageChecklist";

describe("FirstReviewSampleSealedPackageChecklist", () => {
  it("lists sample versus sealed tenant review boundaries", () => {
    render(<FirstReviewSampleSealedPackageChecklist />);

    expect(screen.getByRole("heading", { name: FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_HEADING })).toBeInTheDocument();
    expect(screen.getByText(/not your tenant/i)).toBeInTheDocument();
    expect(screen.getByText(/sealed architecture package/i)).toBeInTheDocument();
  });
});
