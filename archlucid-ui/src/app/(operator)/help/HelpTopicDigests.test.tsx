import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpDigestsGuideView } from "@/app/(operator)/help/_sections/HelpDigestsGuideView";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
} from "@/lib/digests-help-evidence-copy";
import {
  DIGESTS_HELP_OVERVIEW,
  DIGESTS_HELP_PAGE_SUBTITLE,
  DIGESTS_HELP_PAGE_TITLE,
  DIGESTS_HELP_PRIMARY_ACTION,
} from "@/lib/digests-help-guide-content";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpDigestsGuideView", () => {
  const entry = getProductDocumentationEntry("digests");

  it("registers the digests help guide entry", () => {
    expect(entry?.slug).toBe("digests");
    expect(entry?.title).toBe(DIGESTS_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(DIGESTS_HELP_PAGE_SUBTITLE);
    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(entry?.releaseApplicability).toBe("Applies to V1 GA — architecture digests orientation");
  });

  it("shows action panel, orientation strip, and overview in buyer-safe order", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: DIGESTS_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-10");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Applies to V1 GA — architecture digests orientation",
    );
    expect(screen.getByTestId("help-digests-action-panel")).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-overview")).toHaveTextContent(DIGESTS_HELP_OVERVIEW);
  });

  it("shows claim discipline once and cross-topic follow-up links", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByTestId("help-digests-claim-discipline")).toHaveTextContent(DIGESTS_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByRole("heading", { name: DIGESTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: HELP_DILIGENCE_ARTIFACT_INDEX_TITLE })).toBeNull();
    expect(screen.getByTestId("help-digests-sources")).toBeInTheDocument();

    for (const source of DIGESTS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("links the primary action to the destination section", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-digests-action-panel");

    expect(within(actionPanel).getByRole("link", { name: DIGESTS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      DIGESTS_HELP_PRIMARY_ACTION.href,
    );
    expect(within(actionPanel).getAllByRole("link")).toHaveLength(1);
  });

  it("renders how-digests-work stepper, destination card headings, and no TOC rail", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How digests work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where digests are managed" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByTestId("help-digests-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-destination-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("does not surface Sources jargon on the page", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByTestId("help-digests-guide").textContent).not.toMatch(/\bSources\b/);
  });
});
