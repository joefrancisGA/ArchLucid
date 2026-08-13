import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { PrivacyPolicyPageClient } from "@/components/marketing/privacy-policy/PrivacyPolicyPageClient";
import { readPrivacyPolicyMarkdown } from "@/lib/privacy-policy-marketing";
import {
  preparePrivacyPolicyBodyMarkdown,
  parsePrivacyPolicyMetadata,
  resolvePrivacyPolicyQuickNavLinks,
  resolvePrivacyPolicyRelatedDocuments,
} from "@/lib/privacy-policy-content";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";

vi.mock("@/components/marketing/MarketingAccessibilityMarkdownFragment", () => ({
  MarketingAccessibilityMarkdownFragment: () => <div data-testid="privacy-policy-markdown-mock" />,
}));

const markdown = readPrivacyPolicyMarkdown();
const metadata = parsePrivacyPolicyMetadata(markdown);
const bodyMarkdown = preparePrivacyPolicyBodyMarkdown(markdown);
const headings = extractHelpMarkdownHeadings(bodyMarkdown);

describe("PrivacyPolicyPageClient", () => {
  beforeEach(() => {
    document.body.classList.remove("privacy-focused-reading");
    window.location.hash = "";
    vi.restoreAllMocks();
  });

  it("renders the legal document header with dates and version", () => {
    render(
      <PrivacyPolicyPageClient
        metadata={metadata}
        bodyMarkdown={bodyMarkdown}
        headings={headings}
        quickNavLinks={resolvePrivacyPolicyQuickNavLinks(headings)}
        relatedDocuments={resolvePrivacyPolicyRelatedDocuments(headings)}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByText(/Effective date:/)).toBeInTheDocument();
    expect(screen.getByText(/Last reviewed \(UTC\):/)).toBeInTheDocument();
    expect(screen.getByText(/Document version:/)).toBeInTheDocument();
  });

  it("exposes skip link, quick navigation, and utility actions", () => {
    render(
      <PrivacyPolicyPageClient
        metadata={metadata}
        bodyMarkdown={bodyMarkdown}
        headings={headings}
        quickNavLinks={resolvePrivacyPolicyQuickNavLinks(headings)}
        relatedDocuments={resolvePrivacyPolicyRelatedDocuments(headings)}
      />,
    );

    expect(screen.getByRole("link", { name: "Skip to privacy policy" })).toHaveAttribute("href", "#privacy-policy-content");
    expect(screen.getByTestId("privacy-policy-quick-nav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print privacy policy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link to privacy policy" })).toBeInTheDocument();
  });

  it("renders related privacy and trust documents", () => {
    render(
      <PrivacyPolicyPageClient
        metadata={metadata}
        bodyMarkdown={bodyMarkdown}
        headings={headings}
        quickNavLinks={resolvePrivacyPolicyQuickNavLinks(headings)}
        relatedDocuments={resolvePrivacyPolicyRelatedDocuments(headings)}
      />,
    );

    const relatedSection = screen.getByTestId("privacy-policy-related-documents");

    expect(relatedSection).toBeInTheDocument();
    expect(within(relatedSection).getByRole("link", { name: /Trust Center/i })).toHaveAttribute("href", "/trust");
    expect(within(relatedSection).getByRole("link", { name: /Subprocessors/i })).toHaveAttribute(
      "href",
      "/help/subprocessors",
    );
  });

  it("toggles focused reading mode on the document body", () => {
    render(
      <PrivacyPolicyPageClient
        metadata={metadata}
        bodyMarkdown={bodyMarkdown}
        headings={headings}
        quickNavLinks={resolvePrivacyPolicyQuickNavLinks(headings)}
        relatedDocuments={resolvePrivacyPolicyRelatedDocuments(headings)}
      />,
    );

    fireEvent.click(screen.getByTestId("privacy-policy-focused-reading-toggle"));
    expect(document.body.classList.contains("privacy-focused-reading")).toBe(true);

    fireEvent.click(screen.getByTestId("privacy-policy-focused-reading-toggle"));
    expect(document.body.classList.contains("privacy-focused-reading")).toBe(false);
  });

  it("renders approved policy body via markdown fragment", () => {
    render(
      <PrivacyPolicyPageClient
        metadata={metadata}
        bodyMarkdown={bodyMarkdown}
        headings={headings}
        quickNavLinks={resolvePrivacyPolicyQuickNavLinks(headings)}
        relatedDocuments={resolvePrivacyPolicyRelatedDocuments(headings)}
      />,
    );

    expect(screen.getByTestId("privacy-policy-body")).toBeInTheDocument();
    expect(screen.getByTestId("privacy-policy-markdown-mock")).toBeInTheDocument();
    expect(bodyMarkdown).toContain("## 6. Your rights under GDPR");
    expect(bodyMarkdown).not.toContain("## Related documents");
  });
});
