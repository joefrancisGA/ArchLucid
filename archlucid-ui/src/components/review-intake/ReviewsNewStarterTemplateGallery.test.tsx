import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_ACTION,
  REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_LEAD,
} from "@/lib/reviews-new-path-copy";

import { ReviewsNewStarterTemplateGallery } from "./ReviewsNewStarterTemplateGallery";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ReviewsNewStarterTemplateGallery", () => {
  it("offers a browse-more-templates link when the catalog has additional starters", () => {
    render(<ReviewsNewStarterTemplateGallery />);

    const browseMore = screen.getByTestId("reviews-new-starter-template-browse-more");
    expect(within(browseMore).getByText(REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_LEAD)).toBeInTheDocument();
    expect(
      within(browseMore).getByRole("link", { name: REVIEWS_NEW_STARTER_TEMPLATE_BROWSE_MORE_ACTION }),
    ).toHaveAttribute("href", REVIEWS_NEW_DETAILED_HREF);
  });

  it("renders the three featured starter templates", () => {
    render(<ReviewsNewStarterTemplateGallery />);

    expect(screen.getByText("API platform (B2B)")).toBeInTheDocument();
    expect(screen.getByText("Internal operations portal")).toBeInTheDocument();
    expect(screen.getByText("Payments-adjacent (no card data)")).toBeInTheDocument();
    expect(screen.queryByText("IoT telemetry ingest")).toBeNull();
  });
});
