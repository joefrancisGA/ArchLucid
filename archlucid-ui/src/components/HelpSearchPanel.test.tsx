import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpSearchPanel } from "@/components/HelpSearchPanel";
import {
  HELP_SEARCH_PANEL_KEYBOARD_HINT,
  HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER,
  HELP_SEARCH_PANEL_SUBTITLE,
} from "@/lib/help-search-panel-catalog";

const push = vi.fn();
const pathnameMock = vi.hoisted(() => ({ value: "/" }));
const authorityMock = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => pathnameMock.value,
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => authorityMock,
}));

vi.mock("@/components/usability/ProductConceptsGlossaryDialog", () => ({
  ProductConceptsGlossaryDialog: () => null,
}));

vi.mock("@/lib/help-index", () => ({
  searchHelpDocumentation: vi.fn(() => []),
}));

describe("HelpSearchPanel", () => {
  it("renders title, subtitle, search input, and grouped topics", () => {
    pathnameMock.value = "/reviews/new";
    render(<HelpSearchPanel open onOpenChange={() => {}} onOpenGuidesPanel={() => {}} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText(HELP_SEARCH_PANEL_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByLabelText("Search help")).toHaveAttribute("placeholder", HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER);
    expect(screen.getByTestId("help-search-group-start-here")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-group-review-work")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-recommended-group")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-recommended-group")).getByText("First-review guide")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-group-start-here")).getByText("Run a sample review")).toBeInTheDocument();
    expect(screen.getByText("Upload architecture evidence")).toBeInTheDocument();
    expect(screen.queryByText(/engineering runbook/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/operator shell/i)).not.toBeInTheDocument();
  });

  it("shows recommended topics for the current page", () => {
    pathnameMock.value = "/";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByTestId("help-search-recommended-group")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-recommended-group")).getByText("Run a sample review")).toBeInTheDocument();
  });

  it("filters topics when searching and renders an empty state", () => {
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Search help"), {
      target: { value: "zzzz-no-match-zzzz" },
    });

    expect(screen.getByText("No help topics found")).toBeInTheDocument();
    expect(screen.getByText(/Try searching for review, evidence, findings/i)).toBeInTheDocument();
  });

  it("navigates when a route topic row is selected", () => {
    render(<HelpSearchPanel open onOpenChange={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Create your first review package\./i,
      }),
    );

    expect(push).toHaveBeenCalledWith("/reviews/new");
  });

  it("renders topic rows as actionable buttons with chevrons", () => {
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    const firstReviewButton = screen.getByRole("button", {
      name: /First-review guide\./i,
    });

    expect(firstReviewButton).toBeInTheDocument();
    expect(firstReviewButton.tagName).toBe("BUTTON");
  });

  it("opens guides shortcuts tab from footer action", () => {
    const onOpenGuidesPanel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <HelpSearchPanel open onOpenChange={onOpenChange} onOpenGuidesPanel={onOpenGuidesPanel} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenGuidesPanel).toHaveBeenCalledWith("shortcuts");
  });

  it("renders keyboard hint in the footer", () => {
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByTestId("help-search-keyboard-hint")).toHaveTextContent(HELP_SEARCH_PANEL_KEYBOARD_HINT);
    expect(screen.queryByText(/Guides & troubleshooting/i)).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    const onOpenChange = vi.fn();
    render(<HelpSearchPanel open onOpenChange={onOpenChange} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the accessible close button is clicked", () => {
    const onOpenChange = vi.fn();
    render(<HelpSearchPanel open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Close help" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows admin diagnostics topics only for admin callers", () => {
    authorityMock.callerAuthorityRank = 3;
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByText("Admin diagnostics guide")).toBeInTheDocument();
    expect(screen.getByText("Advanced diagnostics")).toBeInTheDocument();
    expect(screen.queryByText(/engineering runbook/i)).not.toBeInTheDocument();

    authorityMock.callerAuthorityRank = 1;
  });
});
