import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HelpSearchPanel } from "@/components/HelpSearchPanel";
import { setHelpPageSituation } from "@/components/help/help-page-situation-store";
import {
  HELP_SEARCH_PANEL_DO_THIS_NOW_HEADING,
  HELP_SEARCH_PANEL_KEYBOARD_HINT,
  HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER,
  HELP_SEARCH_PANEL_SUBTITLE,
  HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL,
} from "@/lib/help/help-search-panel-catalog";
import {
  HELP_ON_HELP_ON_THIS_PAGE_HEADING,
  HELP_ON_HELP_SEARCH_PLACEHOLDER,
  HELP_ON_HELP_SUBTITLE,
} from "@/lib/help/help-on-help";

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

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => authorityMock,
}));

vi.mock("@/components/usability/ProductConceptsGlossaryDialog", () => ({
  ProductConceptsGlossaryDialog: () => null,
}));

vi.mock("@/lib/help/help-index", () => ({
  searchHelpDocumentation: vi.fn(() => []),
}));

afterEach(() => {
  setHelpPageSituation(null);
});

describe("HelpSearchPanel", () => {
  it("renders title, subtitle, search input, and grouped topics", () => {
    pathnameMock.value = "/architecture/reviews/new";
    render(<HelpSearchPanel open onOpenChange={() => {}} onOpenGuidesPanel={() => {}} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText(HELP_SEARCH_PANEL_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByLabelText("Search help")).toHaveAttribute("placeholder", HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER);
    expect(screen.getByTestId("help-search-group-start-here")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-group-review-work")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-recommended-group")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-recommended-group")).getByText("Your first architecture review")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-group-start-here")).getByText("Run a sample review")).toBeInTheDocument();
    expect(screen.getByText("Upload architecture evidence")).toBeInTheDocument();
    expect(screen.queryByText(/engineering runbook/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/operator shell/i)).not.toBeInTheDocument();
  });

  it("shows recommended topics for the current page", () => {
    pathnameMock.value = "/";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByTestId("help-search-do-this-now")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-do-this-now")).getByText("Getting started")).toBeInTheDocument();
    expect(screen.getByTestId("help-search-recommended-group")).toBeInTheDocument();
    expect(within(screen.getByTestId("help-search-recommended-group")).getByText("How ArchLucid works")).toBeInTheDocument();
  });

  it("on core-pilot recommends next steps instead of first-review relaunches (TB-1044)", () => {
    pathnameMock.value = "/help/first-architecture-review";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(within(screen.getByTestId("help-search-do-this-now")).getByText("Create your first review")).toBeInTheDocument();
    const recommended = screen.getByTestId("help-search-recommended-group");
    expect(within(recommended).getByText("Run a sample review")).toBeInTheDocument();
    expect(within(recommended).queryByText("Create your first review")).toBeNull();
    expect(within(recommended).queryByText("Getting started")).toBeNull();
    expect(within(recommended).queryByText("How ArchLucid works")).toBeNull();
    expect(within(recommended).queryByText("Your first architecture review")).toBeNull();
  });

  it("elevates Do this now and caps recommended at two more topics (TB-1045)", () => {
    pathnameMock.value = "/help/first-architecture-review";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByRole("heading", { name: HELP_SEARCH_PANEL_DO_THIS_NOW_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("help-search-do-this-now-primary")).toHaveTextContent("Create your first review");

    const recommended = screen.getByTestId("help-search-recommended-group");
    const recommendedButtons = within(recommended).getAllByRole("button");

    expect(recommendedButtons).toHaveLength(2);
    expect(within(recommended).getByText("Run a sample review")).toBeInTheDocument();
    expect(within(recommended).getByText("Upload architecture evidence")).toBeInTheDocument();
    expect(within(recommended).queryByText("Cloud connections")).toBeNull();
    expect(within(recommended).queryByText("Troubleshoot common issues")).toBeNull();
  });

  it("uses help-on-help copy and on-this-page anchors on /help/* (TB-1046)", () => {
    pathnameMock.value = "/help/first-architecture-review";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByText(HELP_ON_HELP_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByLabelText("Search help")).toHaveAttribute("placeholder", HELP_ON_HELP_SEARCH_PLACEHOLDER);
    expect(screen.getByRole("heading", { name: HELP_ON_HELP_ON_THIS_PAGE_HEADING })).toBeInTheDocument();

    const onThisPage = screen.getByTestId("help-search-on-this-page");
    expect(within(onThisPage).getByText("First review path")).toBeInTheDocument();
    expect(within(onThisPage).getByText("Run the first review")).toBeInTheDocument();
  });

  it("jumps to a current-page hash instead of loading an inline article (TB-1046)", () => {
    pathnameMock.value = "/help/first-architecture-review";
    const onOpenChange = vi.fn();
    render(<HelpSearchPanel open onOpenChange={onOpenChange} />);

    fireEvent.click(
      within(screen.getByTestId("help-search-on-this-page")).getByRole("button", {
        name: /First review path/i,
      }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(window.location.hash).toBe("#first-review-path");
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
        name: /Create your first review\./i,
      }),
    );

    expect(push).toHaveBeenCalledWith("/architecture/reviews/new");
  });

  it("renders topic rows as actionable buttons with chevrons", () => {
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    const firstReviewButton = screen.getByRole("button", {
      name: /Your first architecture review\./i,
    });

    expect(firstReviewButton).toBeInTheDocument();
    expect(firstReviewButton.tagName).toBe("BUTTON");
  });

  it("disambiguates first-hour path vs wizard reference titles (TB-1047)", () => {
    pathnameMock.value = "/architecture/reviews/new";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByText("Your first architecture review")).toBeInTheDocument();
    expect(screen.getByText("Review wizard reference")).toBeInTheDocument();
    expect(screen.queryByText("First review guide")).toBeNull();
    expect(screen.queryByText("Review guide")).toBeNull();
  });

  it("autofocuses the search input when the drawer opens (TB-1047)", () => {
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByLabelText("Search help")).toHaveFocus();
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

  it("opens non-modally so the page behind stays usable (al-ui-rate P0)", () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    const drawer = screen.getByTestId("help-search-panel");

    expect(drawer).toHaveAttribute("aria-modal", "false");
    expect(document.querySelector("[data-radix-dialog-overlay]")).toBeNull();
  });

  it("stays open when the reader interacts with the page behind it", () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    const onOpenChange = vi.fn();
    render(<HelpSearchPanel open onOpenChange={onOpenChange} />);

    fireEvent.pointerDown(document.body);

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("leads with the blocking condition when the page publishes a blocked review", () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    setHelpPageSituation("review-approval-blocked");

    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByTestId("help-search-do-this-now-primary")).toHaveTextContent(
      "Resolve findings that block approval",
    );
  });

  it("falls back to page recommendations once the situation clears", () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    setHelpPageSituation(null);

    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.getByTestId("help-search-do-this-now-primary")).toHaveTextContent(
      "Review findings and evidence trail",
    );
  });

  it("collapses onboarding topics on product surfaces (al-ui-rate P0)", () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    const disclosure = screen.getByTestId("help-search-start-here-disclosure");

    expect(disclosure).toBeInstanceOf(HTMLDetailsElement);
    expect((disclosure as HTMLDetailsElement).open).toBe(false);
  });

  it("keeps onboarding topics expanded on the marketing overview", () => {
    pathnameMock.value = "/";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    expect(screen.queryByTestId("help-search-start-here-disclosure")).toBeNull();
    expect(screen.getByTestId("help-search-group-start-here")).toBeInTheDocument();
  });

  it("names the support footer action after what it opens", () => {
    const onOpenGuidesPanel = vi.fn();
    render(<HelpSearchPanel open onOpenChange={vi.fn()} onOpenGuidesPanel={onOpenGuidesPanel} />);

    expect(screen.queryByRole("button", { name: "Contact support" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL }));

    expect(onOpenGuidesPanel).toHaveBeenCalledWith("troubleshooting");
  });

  it("finds situation topics that are hidden from the browse groups", () => {
    pathnameMock.value = "/architecture/reviews/run-1";
    render(<HelpSearchPanel open onOpenChange={() => {}} />);

    fireEvent.change(screen.getByLabelText("Search help"), { target: { value: "blocking" } });

    expect(screen.getByText("Resolve findings that block approval")).toBeInTheDocument();
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
