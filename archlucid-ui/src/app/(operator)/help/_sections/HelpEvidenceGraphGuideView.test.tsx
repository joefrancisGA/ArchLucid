import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpEvidenceGraphGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceGraphGuideView";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_HELP_SOURCES,
} from "@/lib/evidence-graph-help-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_PRIMARY_ACTION,
  EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE,
  EVIDENCE_GRAPH_HELP_TILE_ITEMS,
} from "@/lib/evidence-graph-help-guide-content";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import {
  EVIDENCE_GRAPH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  EVIDENCE_GRAPH_HELP_SKIP_LINK_LABEL,
  EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-graph-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpEvidenceGraphGuideView", () => {
  const entry = getProductDocumentationEntry("evidence-graph");

  it("renders provenance, header claim discipline, readingBody, and action-first layout", () => {
    if (entry === undefined) {
      throw new Error("Expected evidence-graph documentation entry.");
    }

    render(<HelpEvidenceGraphGuideView entry={entry} />);

    expect(screen.getByTestId("help-evidence-graph-guide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: EVIDENCE_GRAPH_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${EVIDENCE_GRAPH_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.queryByTestId("help-evidence-graph-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-evidence-graph-role-precondition")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-evidence-graph-claim-discipline-strip")).toBeNull();
    expect(screen.getByTestId(EVIDENCE_GRAPH_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("help-evidence-graph-sample-graph-note")).toHaveTextContent(
      EVIDENCE_GRAPH_HELP_SAMPLE_GRAPH_NOTE,
    );
    expect(screen.getByTestId("help-evidence-graph-sample-graph-note").textContent?.toLowerCase()).toContain(
      "azure reference",
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
    expect(screen.getByRole("heading", { level: 2, name: EVIDENCE_GRAPH_HELP_TOPIC_LABEL })).toBeInTheDocument();

    for (const item of EVIDENCE_GRAPH_HELP_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    const sources = screen.getByTestId("help-evidence-graph-sources");
    const orientation = screen.getByTestId("help-evidence-graph-orientation");
    const primaryContent = screen.getByTestId("help-evidence-graph-primary-content");
    const actionPanel = screen.getByTestId("help-evidence-graph-action-panel");

    expect(primaryContent).toContainElement(actionPanel);
    expect(actionPanel.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of EVIDENCE_GRAPH_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: new RegExp(source.label, "i") })).toHaveAttribute(
        "href",
        source.href,
      );
    }

    expect(screen.queryByRole("link", { name: "Read evidence trail help →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Search review evidence →" })).not.toBeInTheDocument();
    expect(within(sources).queryByRole("link", { name: /evidence graph help/i })).not.toBeInTheDocument();
  });
});
