import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";

import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";

describe("OperatorHomeGuidanceLink", () => {
  it("renders visible text guidance instead of an icon-only control", () => {
    render(
      <OperatorHomeGuidanceLink
        helpSlug="first-architecture-review"
        label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
      />,
    );

    const link = screen.getByRole("link", { name: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE });

    expect(link).toHaveTextContent(FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE);
    expect(link).toHaveAttribute("href", "/help/first-architecture-review");
  });
});
