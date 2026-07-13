import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGlossaryPageView } from "@/app/(operator)/help/_sections/HelpGlossaryPageView";
import {
  CUSTOMER_GLOSSARY_EMPTY_STATE,
  CUSTOMER_GLOSSARY_PAGE_INTRO,
  CUSTOMER_GLOSSARY_PAGE_TITLE,
  CUSTOMER_GLOSSARY_SEARCH_LABEL,
} from "@/lib/customer-glossary-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_INTERNAL_COPY = [
  "Record-type field taxonomy",
  "Implementation alignment",
  "Finding field schema",
  "Decision field schema",
  "Risk field schema",
  "Control field schema",
  "ArchLucid.Decisioning",
  "payload",
  "TenantId",
] as const;

describe("HelpGlossaryPageView", () => {
  const entry = getProductDocumentationEntry("glossary");

  it("registers the glossary help entry", () => {
    expect(entry?.slug).toBe("glossary");
    expect(entry?.title).toBe(CUSTOMER_GLOSSARY_PAGE_TITLE);
  });

  it("renders one H1 and customer intro copy without internal schema sections", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: CUSTOMER_GLOSSARY_PAGE_TITLE })).toHaveLength(1);
    expect(screen.getByText(CUSTOMER_GLOSSARY_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByLabelText(CUSTOMER_GLOSSARY_SEARCH_LABEL)).toBeInTheDocument();

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(screen.queryByText(new RegExp(banned, "i"))).toBeNull();
    }
  });

  it("supports search, category filters, and empty state", async () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    expect(screen.getByTestId("glossary-term-finding")).toBeInTheDocument();
    expect(screen.getByTestId("glossary-term-review")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("glossary-search-input"), { target: { value: "zzzz-no-match" } });

    expect(screen.getByTestId("glossary-empty-state")).toHaveTextContent(CUSTOMER_GLOSSARY_EMPTY_STATE);

    fireEvent.change(screen.getByTestId("glossary-search-input"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));

    expect(screen.getByTestId("glossary-term-evidence-trail")).toBeInTheDocument();
    expect(screen.queryByTestId("glossary-term-finding")).toBeNull();
  });

  it("links related terms and uses glossary category navigation", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    const findingTerm = screen.getByTestId("glossary-term-finding");
    const riskLink = within(findingTerm).getByRole("link", { name: "Risk" });

    expect(riskLink).toHaveAttribute("href", "#term-risk");

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: "Search and browse" })).toHaveAttribute("href", "#glossary-search");
    expect(within(toc).getByRole("link", { name: "Review process" })).toHaveAttribute("href", "#category-review-process");
    expect(within(toc).queryByRole("link", { name: /Finding fields/i })).toBeNull();
  });

  it("shows deprecated aliases for signed review record without using Signed manifest as the label", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    const signedTerm = screen.getByTestId("glossary-term-signed-review-record");

    expect(within(signedTerm).getByRole("heading", { level: 3, name: "Signed review record" })).toBeInTheDocument();
    expect(within(signedTerm).getByText(/Signed manifest/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "Signed manifest" })).toBeNull();
  });

  it("announces result counts when filtering", async () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    fireEvent.change(screen.getByTestId("glossary-search-input"), { target: { value: "audit" } });

    expect(screen.getByRole("status")).toHaveTextContent(/term/i);
  });
});
