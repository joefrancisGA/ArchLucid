import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpHowArchLucidWorksGuideView } from "@/app/(operator)/help/_sections/HelpHowArchLucidWorksGuideView";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import {
  HOW_ARCHLUCID_WORKS_SECTIONS,
  HOW_ARCHLUCID_WORKS_SUBTITLE,
} from "@/lib/how-archlucid-works-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_WORKFLOW_COPY = [
  "tenant isolation",
  "Azure OpenAI",
  "SOC 2",
  "append-only audit",
  "dedicated database",
] as const;

describe("HelpHowArchLucidWorksGuideView", () => {
  const entry = getProductDocumentationEntry("how-it-works");

  it("registers the workflow help topic", () => {
    expect(entry?.title).toBe("How ArchLucid works");
    expect(entry?.slug).toBe("how-it-works");
    expect(entry?.summary).toContain("architecture evidence");
  });

  it("renders workflow actions, diagram, and seven sections", () => {
    if (entry === undefined) {
      throw new Error("Expected how-it-works documentation entry.");
    }

    render(<HelpHowArchLucidWorksGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "How ArchLucid works" })).toBeInTheDocument();
    expect(screen.getByText(HOW_ARCHLUCID_WORKS_SUBTITLE)).toBeInTheDocument();

    const actions = screen.getByTestId("how-archlucid-works-actions");
    expect(within(actions).getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(within(actions).getByRole("link", { name: "Open completed sample" })).toBeInTheDocument();
    expect(within(actions).getByRole("link", { name: "View first review guide" })).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );

    expect(screen.getByTestId("how-archlucid-works-diagram")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Exports")).toBeInTheDocument();

    for (const section of HOW_ARCHLUCID_WORKS_SECTIONS) {
      expect(screen.getByRole("heading", { name: section.title })).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: "What ArchLucid does with your data" })).toHaveAttribute(
      "href",
      "/help/data-handling",
    );
  });

  it("avoids deep security and data-handling copy on the workflow page", () => {
    if (entry === undefined) {
      throw new Error("Expected how-it-works documentation entry.");
    }

    render(<HelpHowArchLucidWorksGuideView entry={entry} />);

    const corpus = document.body.textContent?.toLowerCase() ?? "";

    for (const term of BANNED_WORKFLOW_COPY) {
      expect(corpus, term).not.toContain(term.toLowerCase());
    }
  });
});
