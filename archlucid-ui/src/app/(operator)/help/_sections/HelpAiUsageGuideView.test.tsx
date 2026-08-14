import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpAiUsageGuideView } from "@/app/(operator)/help/_sections/HelpAiUsageGuideView";
import {
  AI_USAGE_HELP_ACCESS_PRECONDITION,
  AI_USAGE_HELP_CLAIM_HEADING_ID,
  AI_USAGE_HELP_GUIDE_HEADINGS,
  AI_USAGE_HELP_HOW_IT_WORKS_SECTION_TITLE,
  AI_USAGE_HELP_PRIMARY_ACTION,
} from "@/lib/ai-usage-help-guide-content";
import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/ai-usage-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAiUsageGuideView", () => {
  const entry = getProductDocumentationEntry("ai-usage");

  it("renders provenance, access precondition, and claim discipline heading", () => {
    if (entry === undefined) {
      throw new Error("Expected ai-usage documentation entry.");
    }

    render(<HelpAiUsageGuideView entry={entry} />);

    expect(screen.getByTestId("help-ai-usage-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Guide last reviewed 2026-08-13 · Administration · AI usage orientation",
    );
    expect(screen.getByTestId("help-ai-usage-access-precondition")).toHaveTextContent(
      AI_USAGE_HELP_ACCESS_PRECONDITION,
    );
    expect(screen.getByRole("heading", { name: AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      AI_USAGE_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-ai-usage-claim-discipline").textContent).toContain(
      AI_USAGE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("link", { name: AI_USAGE_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      AI_USAGE_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: AI_USAGE_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: AI_USAGE_HELP_HOW_IT_WORKS_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Estimated spend" })).toHaveAttribute(
      "href",
      "/administration/ai-usage#ai-usage-kpi-row",
    );
    expect(screen.getByRole("link", { name: "Workflow filters" })).toHaveAttribute(
      "href",
      "/administration/ai-usage#ai-usage-filters-bar",
    );
    expect(screen.queryByRole("link", { name: "Read billing and plans help →" })).toBeNull();

    for (const heading of AI_USAGE_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
