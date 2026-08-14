import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpAdvisoryScansGuideView } from "@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView";
import {
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  ADVISORY_SCANS_HELP_SOURCES,
} from "@/lib/advisory-scans-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
  ADVISORY_SCANS_HELP_PRIMARY_ACTION,
  ADVISORY_SCANS_HELP_ROLE_PRECONDITION,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
} from "@/lib/advisory-scans-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAdvisoryScansGuideView", () => {
  const entry = getProductDocumentationEntry("advisory-scans");

  it("renders breadcrumb, provenance, role precondition, readingBody, and claim discipline heading", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    expect(screen.getByTestId("help-advisory-scans-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent(HELP_TOPIC_BREADCRUMB_HUB_LABEL);
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · governance advisory scans orientation",
    );
    expect(screen.getByTestId("help-advisory-scans-role-precondition")).toHaveTextContent(
      ADVISORY_SCANS_HELP_ROLE_PRECONDITION,
    );
    expect(screen.getByTestId("help-advisory-scans-role-precondition").textContent?.toLowerCase()).not.toContain("now");
    expect(screen.getByTestId("help-advisory-scans-role-precondition").textContent?.toLowerCase()).not.toContain(
      "executions",
    );
    expect(screen.getByRole("heading", { name: ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-advisory-scans-claim-discipline").textContent).toContain(
      ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-advisory-scans-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-advisory-scans-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByRole("link", { name: "Explainability trail" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Finalize an architecture review" })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getAllByRole("link", { name: ADVISORY_SCANS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();

    for (const item of ADVISORY_SCANS_HELP_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const source of ADVISORY_SCANS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: "AI usage help" })).toHaveAttribute("href", "/help/ai-usage");
  });
});
