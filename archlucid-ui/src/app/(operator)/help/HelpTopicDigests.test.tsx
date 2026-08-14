import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpDigestsGuideView } from "@/app/(operator)/help/_sections/HelpDigestsGuideView";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
  DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK,
  DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS,
} from "@/lib/digests-help-evidence-copy";
import {
  DIGESTS_HELP_CLAIM_HEADING_ID,
  DIGESTS_HELP_CONTENT_ITEMS,
  DIGESTS_HELP_GUIDE_HEADINGS,
  DIGESTS_HELP_OVERVIEW,
  DIGESTS_HELP_PAGE_SUBTITLE,
  DIGESTS_HELP_PAGE_TITLE,
  DIGESTS_HELP_PRIMARY_ACTION,
  DIGESTS_HELP_SAMPLE_DIGEST_BROWSE_LABEL,
} from "@/lib/digests-help-guide-content";
import { DIGESTS_BROWSE_TAB_PATH, DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpDigestsGuideView", () => {
  const entry = getProductDocumentationEntry("digests");

  it("registers the digests help guide entry", () => {
    expect(entry?.slug).toBe("digests");
    expect(entry?.title).toBe(DIGESTS_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(DIGESTS_HELP_PAGE_SUBTITLE);
    expect(entry?.lastReviewed).toBe("2026-08-10");
    expect(entry?.releaseApplicability).toBe("architecture digests orientation");
  });

  it("shows overview first and buyer-safe section order", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: DIGESTS_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    const overview = screen.getByTestId("help-digests-overview");
    const claimDiscipline = screen.getByTestId("help-digests-claim-discipline");
    const followUpsHeading = screen.getByRole("heading", { name: DIGESTS_HELP_FOLLOW_UPS_TITLE });

    expect(overview).toHaveTextContent(DIGESTS_HELP_OVERVIEW);
    expect(overview.compareDocumentPosition(claimDiscipline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(followUpsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(claimDiscipline.className).not.toMatch(/amber/);
  });

  it("shows digest content types, sample panel, and subscription constraints", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "What a digest contains" })).toBeInTheDocument();

    const contentItems = screen.getByTestId("help-digests-content-items");
    for (const item of DIGESTS_HELP_CONTENT_ITEMS) {
      expect(within(contentItems).getByText(item.label)).toBeInTheDocument();
      expect(within(contentItems).getByRole("link", { name: item.sourceSurface })).toHaveAttribute("href", item.href);
    }

    expect(screen.getByTestId("help-digests-sample")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: DIGESTS_HELP_SAMPLE_DIGEST_BROWSE_LABEL })).toHaveAttribute(
      "href",
      DIGESTS_BROWSE_TAB_PATH,
    );

    const constraints = screen.getByTestId("help-digests-subscription-constraints");
    for (const constraint of DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS) {
      expect(within(constraints).getByText(constraint.label)).toBeInTheDocument();
      expect(within(constraints).getByText(constraint.detail)).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK.label })).toHaveAttribute(
      "href",
      DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK.href,
    );
  });

  it("shows claim discipline once and cross-topic follow-up links", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByTestId("help-digests-claim-discipline")).toHaveTextContent(DIGESTS_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByRole("heading", { name: DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      DIGESTS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("heading", { name: DIGESTS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: HELP_DILIGENCE_ARTIFACT_INDEX_TITLE })).toBeNull();
    expect(screen.getByTestId("help-digests-sources")).toBeInTheDocument();

    const followUps = screen.getByTestId("help-digests-sources");
    for (const source of DIGESTS_HELP_SOURCES) {
      expect(within(followUps).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("links the primary action to the Schedule tab", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-digests-action-panel");

    expect(within(actionPanel).getByRole("link", { name: DIGESTS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      DIGESTS_SCHEDULE_TAB_PATH,
    );
    expect(DIGESTS_HELP_PRIMARY_ACTION.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(within(actionPanel).getAllByRole("link")).toHaveLength(1);
    expect(actionPanel.className).not.toMatch(/teal-50/);
  });

  it("renders how-digests-work steps, destination cards, and TOC rail", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How digests work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where digests are managed" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(screen.getByTestId("help-digests-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-digests-destination-cards")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();

    for (const heading of DIGESTS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });

  it("does not surface Sources jargon on the page", () => {
    if (entry === undefined) {
      throw new Error("Expected digests documentation entry.");
    }

    render(<HelpDigestsGuideView entry={entry} />);

    expect(screen.getByTestId("help-digests-guide").textContent).not.toMatch(/\bSources\b/);
  });
});
