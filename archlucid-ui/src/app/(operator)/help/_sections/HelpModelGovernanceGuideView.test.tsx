import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpModelGovernanceGuideView } from "@/app/(operator)/help/_sections/HelpModelGovernanceGuideView";
import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING,
  MODEL_GOVERNANCE_HELP_SOURCES,
} from "@/lib/model-governance-help-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_AI_USAGE_HREF,
  MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID,
  MODEL_GOVERNANCE_HELP_PRIMARY_ACTION,
} from "@/lib/model-governance-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpModelGovernanceGuideView", () => {
  const entry = getProductDocumentationEntry("model-governance");

  it("renders overview, spend-signals link, claim heading id, and sources", () => {
    if (entry === undefined) {
      throw new Error("Expected model-governance documentation entry.");
    }

    render(<HelpModelGovernanceGuideView entry={entry} />);

    expect(screen.getByTestId("help-model-governance-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-model-governance-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-model-governance-claim-discipline").textContent).toContain(
      MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: "Spend signals" })).toHaveAttribute("href", MODEL_GOVERNANCE_HELP_AI_USAGE_HREF);
    expect(screen.getByRole("link", { name: MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.href,
    );

    const sourcesSection = screen.getByTestId("help-model-governance-sources");

    for (const source of MODEL_GOVERNANCE_HELP_SOURCES) {
      expect(within(sourcesSection).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
