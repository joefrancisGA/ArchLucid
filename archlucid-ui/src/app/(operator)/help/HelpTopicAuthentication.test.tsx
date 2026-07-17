import { render, screen } from "@testing-library/react";
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
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

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
});
