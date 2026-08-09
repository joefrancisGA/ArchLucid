import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { findCustomerAuthBannedPhrases } from "@/lib/auth/customer-auth-messaging";
import { AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR } from "@/lib/authentication-sign-in-help-triage";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { resolveNavLinkForPathname } from "@/lib/resolve-nav-link-for-pathname";

describe("HelpTopicMarkdownView authentication and sign-in", () => {
  const loaded = tryLoadProductDocumentation("authentication-sign-in");

  it("loads authentication help markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders passwordless sign-in guidance without work-identity-only language", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const text = document.body.textContent ?? "";

    expect(screen.getByRole("heading", { level: 1, name: "Authentication and sign-in" })).toBeInTheDocument();
    expect(text).toMatch(/one-time code/i);
    expect(text).toMatch(/work or school account/i);
    expect(findCustomerAuthBannedPhrases(text)).toEqual([]);
    expect(text).not.toMatch(/create a password/i);
    expect(text).toMatch(/not available as a routine bypass/i);
  });

  it("shows registry provenance, sign-in triage, and a single ghost export control", () => {
    if (loaded === null) {
      throw new Error("Expected authentication documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-04");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Applies to hosted SaaS sign-in, invitations, and SSO-enforced tenants",
    );
    expect(screen.getByTestId("help-topic-sign-in-failure-triage")).toBeInTheDocument();
    const triage = screen.getByTestId("help-topic-sign-in-failure-triage");

    expect(within(triage).getByRole("link", { name: "Common sign-in issues" })).toHaveAttribute(
      "href",
      `#${AUTHENTICATION_SIGN_IN_COMMON_ISSUES_ANCHOR}`,
    );
    expect(screen.getByRole("link", { name: "audit trail" })).toHaveAttribute("href", "/help/audit-trail");
    expect(screen.getAllByTestId("help-topic-export-actions")[0]?.querySelectorAll("button, a")).toHaveLength(1);
    expect(screen.getByTestId("help-topic-download-pdf")).toHaveTextContent("Download PDF");
    expect(screen.queryByTestId("help-topic-print-pdf")).not.toBeInTheDocument();
  });

  it("registers help center in nav for authentication-sign-in routes", () => {
    const navLink = resolveNavLinkForPathname("/help/authentication-sign-in");

    expect(navLink?.href).toBe("/help");
    expect(navLink?.label).toBe("Help");
  });
});
