import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchReviewEvidenceClaimOrientationStrip } from "./SearchReviewEvidenceClaimOrientationStrip";

describe("SearchReviewEvidenceClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<SearchReviewEvidenceClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("search-review-evidence-sources")).toBeInTheDocument();
  });
});
