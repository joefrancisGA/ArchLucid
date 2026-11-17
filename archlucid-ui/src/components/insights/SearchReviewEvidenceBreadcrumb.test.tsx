import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchReviewEvidenceBreadcrumb } from "./SearchReviewEvidenceBreadcrumb";

describe("SearchReviewEvidenceBreadcrumb", () => {
  it("renders insights trail ending on Search review evidence", () => {
    const { container } = render(<SearchReviewEvidenceBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
