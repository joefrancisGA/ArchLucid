import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpEvidenceGraphGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceGraphGuideView";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING,
  EVIDENCE_GRAPH_HELP_SOURCES,
} from "@/lib/evidence-graph-help-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID,
  EVIDENCE_GRAPH_HELP_PRIMARY_ACTION,
  EVIDENCE_GRAPH_HELP_ROLE_PRECONDITION,
  EVIDENCE_GRAPH_HELP_ROLE_PRECONDITION_TAG,
  EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE,
  EVIDENCE_GRAPH_HELP_TILE_ITEMS,
} from "@/lib/evidence-graph-help-guide-content";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpEvidenceGraphGuideView", () => {
  const entry = getProductDocumentationEntry("evidence-graph");

  it("renders breadcrumb, provenance, role precondition, readingBody, and claim discipline heading", () => {
    if (entry === undefined) {
      throw new Error("Expected evidence-graph documentation entry.");
    }

    render(<HelpEvidenceGraphGuideView entry={entry} />);

    expect(screen.getByTestId("help-evidence-graph-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent(HELP_TOPIC_BREADCRUMB_HUB_LABEL);
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · insights evidence graph orientation",
    );
    expect(screen.getByTestId("help-evidence-graph-role-precondition")).toHaveTextContent(
      EVIDENCE_GRAPH_HELP_ROLE_PRECONDITION,
    );
    expect(screen.getByTestId("help-evidence-graph-role-precondition-tag")).toHaveTextContent(
      EVIDENCE_GRAPH_HELP_ROLE_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-evidence-graph-sample-graph-note")).toHaveTextContent(
      EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE,
    );
    expect(screen.getByTestId("help-evidence-graph-sample-graph-note").textContent?.toLowerCase()).toContain(
      "azure reference",
    );
    expect(screen.getByRole("heading", { name: EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-evidence-graph-claim-discipline").textContent).toContain(
      EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-evidence-graph-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-evidence-graph-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByRole("link", { name: EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: EVIDENCE_GRAPH_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Start here" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: EVIDENCE_GRAPH_HELP_TOPIC_LABEL })).toBeInTheDocument();

    for (const item of EVIDENCE_GRAPH_HELP_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const source of EVIDENCE_GRAPH_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.queryByRole("link", { name: "Read evidence trail help →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Search review evidence →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Evidence graph" })).not.toBeInTheDocument();
  });
});
