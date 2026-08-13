import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpArchitectureScorecardGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView";
import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
import { HelpPilotOutcomesGuideView } from "@/app/(operator)/help/_sections/HelpPilotOutcomesGuideView";
import { HelpStandardsRulesGuideView } from "@/app/(operator)/help/_sections/HelpStandardsRulesGuideView";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("specialty help guides — pilot outcomes, scorecard, connection status, standards & rules", () => {
  it.each([
    ["pilot-outcomes", HelpPilotOutcomesGuideView, "help-pilot-outcomes-guide"],
    ["architecture-scorecard", HelpArchitectureScorecardGuideView, "help-architecture-scorecard-guide"],
    ["connection-status", HelpConnectionStatusGuideView, "help-connection-status-guide"],
    ["standards-and-rules", HelpStandardsRulesGuideView, "help-standards-rules-guide"],
  ] as const)("registers and renders %s specialty guide", (slug, View, testId) => {
    const entry = getProductDocumentationEntry(slug);

    expect(entry?.slug).toBe(slug);

    if (entry === undefined) {
      throw new Error(`Expected ${slug} documentation entry.`);
    }

    render(<View entry={entry} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
  });
});
