import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn(() => "/architecture/reviews");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

describe("PageContextualHelpButton", () => {
  it("prefers the contextual registry popover over a direct help link on migrated pages", () => {
    mockUsePathname.mockReturnValue("/architecture/reviews");

    render(<PageContextualHelpButton />);

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger.tagName).toBe("BUTTON");
    expect(screen.queryByRole("link", { name: /help: reviews/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/review-packages",
    );
  });

  it("falls back to a direct help link when the route is not migrated", () => {
    mockUsePathname.mockReturnValue("/insights/roi-summary");

    render(<PageContextualHelpButton />);

    const link = screen.getByRole("link", { name: /view roi methodology/i });

    expect(link).toHaveAttribute("href", "/help/pilot-roi-model");
    expect(screen.queryByTestId("page-scoped-contextual-help-panel")).not.toBeInTheDocument();
  });

  it("uses Category-1 popover on architecture draft detail pages (ARR)", () => {
    mockUsePathname.mockReturnValue("/architecture/architectures/draft-abc");

    render(<PageContextualHelpButton />);

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger.tagName).toBe("BUTTON");

    fireEvent.click(trigger);

    expect(screen.getByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/getting-started",
    );
  });
});


