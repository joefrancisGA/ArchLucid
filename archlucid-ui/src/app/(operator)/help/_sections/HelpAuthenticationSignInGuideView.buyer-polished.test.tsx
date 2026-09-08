/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/authentication-sign-in",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpAuthenticationSignInGuideView } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInGuideView";
import {
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS,
} from "@/lib/authentication-sign-in-help-guide-content";
import {
  AUTHENTICATION_SIGN_IN_HELP_FIRST_VIEWPORT_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_LEAD,
  AUTHENTICATION_SIGN_IN_HELP_PAGE_SUBTITLE_BUYER,
  AUTHENTICATION_SIGN_IN_HELP_PRIMARY_CONTENT_ID,
  AUTHENTICATION_SIGN_IN_HELP_SKIP_LINK_LABEL,
  AUTHENTICATION_SIGN_IN_HELP_SKIP_TARGET_ID,
  AUTHENTICATION_SIGN_IN_HELP_START_HERE_HELPER,
} from "@/lib/authentication-sign-in-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAuthenticationSignInGuideView buyer-polished shell (HEA)", () => {
  const loaded = tryLoadProductDocumentation("authentication-sign-in");

  it("renders skip link, header claim discipline, first-viewport action panel, and bottom Sources", () => {
    if (loaded === null) {
      throw new Error("Expected authentication-sign-in documentation to load.");
    }

    render(<HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: AUTHENTICATION_SIGN_IN_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AUTHENTICATION_SIGN_IN_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(AUTHENTICATION_SIGN_IN_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AUTHENTICATION_SIGN_IN_HELP_PAGE_SCOPE)).not.toBeInTheDocument();
    expect(screen.getByTestId(AUTHENTICATION_SIGN_IN_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-authentication-sign-in-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-sign-in-failure-triage")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-authentication-sign-in-related-topics")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-authentication-sign-in-intro")).toHaveTextContent(
      AUTHENTICATION_SIGN_IN_HELP_PAGE_LEAD,
    );
    expect(screen.getByRole("heading", { level: 2, name: AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(AUTHENTICATION_SIGN_IN_HELP_PRIMARY_CONTENT_ID);
    const buyerFirstViewport = screen.getByTestId(AUTHENTICATION_SIGN_IN_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-authentication-sign-in-action-panel");
    const markdownFirstViewport = screen.getByTestId("help-authentication-sign-in-first-viewport");
    const orientationBottom = screen.getByTestId(AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(buyerFirstViewport);
    expect(buyerFirstViewport).toContainElement(screen.getByTestId("help-authentication-sign-in-intro"));
    expect(buyerFirstViewport).toContainElement(actionPanel);
    expect(actionPanel).toHaveTextContent(AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE);
    expect(within(actionPanel).getByRole("link", { name: "Start your evaluation" })).toHaveAttribute(
      "href",
      AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.startEvaluation.href,
    );
    expect(screen.getByTestId("help-authentication-sign-in-start-here-helper")).toHaveTextContent(
      AUTHENTICATION_SIGN_IN_HELP_START_HERE_HELPER,
    );
    expect(primaryContent).toContainElement(markdownFirstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(buyerFirstViewport.compareDocumentPosition(markdownFirstViewport) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(markdownFirstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("authentication-sign-in-help-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(AUTHENTICATION_SIGN_IN_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
