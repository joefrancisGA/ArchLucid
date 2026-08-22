import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PageContextualHelpEntry } from "@/lib/contextual-help-registry";

const mockUsePathname = vi.fn(() => "/architecture/reviews");
const mockContextualHelpForPathname = vi.fn<(pathname: string) => PageContextualHelpEntry | null>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/lib/contextual-help-registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/contextual-help-registry")>();

  return {
    ...actual,
    contextualHelpForPathname: (pathname: string) => mockContextualHelpForPathname(pathname),
  };
});

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";

const MINIMAL_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage: "Short page summary.",
  whatToDoNext: "Do the next thing.",
};

describe("PageContextualHelpButton", () => {
  it("opens the contextual help drawer instead of navigating away on migrated pages", async () => {
    mockUsePathname.mockReturnValue("/architecture/reviews");
    mockContextualHelpForPathname.mockReturnValue(MINIMAL_ENTRY);

    render(<PageContextualHelpButton />);

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.className).not.toMatch(/\bborder(?:\s|-neutral|-transparent)/);
    expect(screen.queryByRole("link", { name: /help: reviews/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(await screen.findByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/review-packages",
    );
  });

  it("shows contextual panel on Internal Ops recommendation-learning", async () => {
    mockUsePathname.mockReturnValue("/internal/recommendation-learning");
    mockContextualHelpForPathname.mockReturnValue(MINIMAL_ENTRY);

    render(<PageContextualHelpButton />);

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger.tagName).toBe("BUTTON");

    fireEvent.click(trigger);

    expect(await screen.findByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/pilot-feedback",
    );
  });

  it("opens the Category-1 drawer on architecture draft detail pages (ARR)", async () => {
    mockUsePathname.mockReturnValue("/architecture/architectures/draft-abc");
    mockContextualHelpForPathname.mockReturnValue(MINIMAL_ENTRY);

    render(<PageContextualHelpButton />);

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger.tagName).toBe("BUTTON");

    fireEvent.click(trigger);

    expect(await screen.findByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/architecture-drafts",
    );
  });

  it("renders nothing on in-app help topic pages", () => {
    mockUsePathname.mockReturnValue("/help/getting-started");

    const { container } = render(<PageContextualHelpButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it("opens the drawer with a full-help link when Category-1 answers are not registered", async () => {
    mockUsePathname.mockReturnValue("/architecture/reviews");
    mockContextualHelpForPathname.mockReturnValue(null);

    render(<PageContextualHelpButton />);

    const trigger = screen.getByTestId("page-contextual-help-button");

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.className).not.toMatch(/\bborder(?:\s|-neutral|-transparent)/);

    fireEvent.click(trigger);

    expect(await screen.findByTestId("page-scoped-contextual-help-panel")).toBeInTheDocument();
    expect(screen.getByText("Open the full help page for guidance on this screen.")).toBeInTheDocument();
    expect(screen.getByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/review-packages",
    );
  });
});
