import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Contextual help</button>,
}));

vi.mock("@/components/help/AuthenticationSignInHelpEvidenceOrientationStrip", () => ({
  AuthenticationSignInHelpEvidenceOrientationStrip: () => (
    <div data-testid="authentication-sign-in-help-claim-discipline">Claim discipline</div>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/authentication-sign-in",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpAuthenticationSignInGuideView } from "@/app/(operator)/help/_sections/HelpAuthenticationSignInGuideView";
import { findCustomerAuthBannedPhrases } from "@/lib/auth/customer-auth-messaging";
import { AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION } from "@/lib/authentication-sign-in-help-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS,
  AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS,
} from "@/lib/authentication-sign-in-help-guide-content";
import {
  authenticationSignInHelpRelatedTopics,
} from "@/lib/authentication-sign-in-help-related-topics";
import { AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR } from "@/lib/authentication-sign-in-help-triage";
import { TROUBLESHOOTING_EMAIL_SUPPORT_LINK } from "@/lib/troubleshooting-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAuthenticationSignInGuideView", () => {
  const loaded = tryLoadProductDocumentation("authentication-sign-in");

  it("loads authentication help markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders passwordless sign-in guidance without work-identity-only language", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    render(<HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const text = document.body.textContent ?? "";

    expect(screen.getByRole("heading", { level: 1, name: "Authentication and sign-in" })).toBeInTheDocument();
    expect(text).toMatch(/one-time code/i);
    expect(text).toMatch(/work or school account/i);
    expect(findCustomerAuthBannedPhrases(text)).toEqual([]);
    expect(text).not.toMatch(/create a password/i);
    expect(text).toMatch(/not available as a routine bypass/i);
  });

  it("renders specialty chrome with sign-in triage, primary CTA, and export controls", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    render(<HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-authentication-sign-in-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-authentication-sign-in-page-scope")).toBeInTheDocument();
    expect(screen.getByTestId("authentication-sign-in-help-claim-discipline")).toBeInTheDocument();

    const triage = screen.getByTestId("help-topic-sign-in-failure-triage");

    expect(within(triage).getByRole("link", { name: "Common sign-in issues" })).toHaveAttribute(
      "href",
      `#${AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR}`,
    );
    expect(within(triage).getByRole("link", { name: TROUBLESHOOTING_EMAIL_SUPPORT_LINK.label })).toHaveAttribute(
      "href",
      TROUBLESHOOTING_EMAIL_SUPPORT_LINK.href,
    );

    const headerActions = screen.getByTestId("help-authentication-sign-in-header-actions");

    expect(within(headerActions).getByTestId(AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.href,
    );
    expect(within(headerActions).getByTestId("help-topic-print-pdf")).toHaveTextContent("Print / Save as PDF");
    expect(within(headerActions).queryByTestId("help-topic-download-pdf")).toBeNull();
  });

  it("keeps eval/invite CTAs above the fold and demotes SSO/recovery depth to disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    render(<HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const firstViewport = screen.getByTestId("help-authentication-sign-in-first-viewport");
    const actionPanel = screen.getByTestId("help-authentication-sign-in-action-panel");

    expect(actionPanel).toHaveTextContent(AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE);
    expect(within(actionPanel).getByRole("link", { name: "Start your evaluation" })).toHaveAttribute(
      "href",
      AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.startEvaluation.href,
    );
    expect(within(actionPanel).getByRole("link", { name: "Accept an invitation" })).toHaveAttribute(
      "href",
      AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.acceptInvitation.href,
    );
    expect(screen.getAllByRole("link", { name: "Start your evaluation" })).toHaveLength(1);
    expect(within(firstViewport).queryByText(/Organization sign-in required/i)).toBeNull();
    expect(within(firstViewport).queryByText(/Optional SSO/i)).toBeNull();

    const commonIssues = screen.getByTestId(
      AUTHENTICATION_SIGN_IN_HELP_COLLAPSIBLE_SECTIONS.commonIssues.testId,
    );

    expect(commonIssues).not.toHaveAttribute("open");

    const summary = commonIssues.querySelector("summary");

    if (summary === null) {
      throw new Error("Expected common issues disclosure summary.");
    }

    fireEvent.click(summary);

    expect(commonIssues).toHaveAttribute("open");
    expect(within(commonIssues).getByText(/Organization sign-in required/i)).toBeInTheDocument();
  });

  it("caps Related at two product-safe guides and routes SSO setup to the wizard (TB-1617)", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    render(<HelpAuthenticationSignInGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const related = screen.getByTestId("help-authentication-sign-in-related-topics");
    const relatedLinks = within(related).getAllByRole("link");

    expect(relatedLinks).toHaveLength(authenticationSignInHelpRelatedTopics().length);
    expect(relatedLinks).toHaveLength(2);
    expect(within(related).queryByRole("link", { name: /enterprise onboarding/i })).toBeNull();
  });
});
