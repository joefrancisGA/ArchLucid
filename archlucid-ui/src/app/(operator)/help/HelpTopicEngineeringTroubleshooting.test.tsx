import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/developer-troubleshooting",
}));

import { HelpEngineeringTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView";
import { ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS } from "@/lib/engineering-troubleshooting-help-guide-content";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpEngineeringTroubleshootingGuideView", () => {
  const loaded = tryLoadProductDocumentation("developer-troubleshooting");

  it("loads engineering troubleshooting help from runbook sources", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("developer-troubleshooting");
    expect(loaded?.entry.title).toBe("Engineering troubleshooting runbook");
    expect(loaded?.entry.lastReviewed).toBe("2026-08-09");
    expect(loaded?.entry.releaseApplicability).toContain("V1 GA");
  });

  it("renders Admin internal chrome, provenance, symptom lookup, and demoted customer-path actions", () => {
    if (loaded === null) {
      throw new Error("Expected developer-troubleshooting documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "developer-troubleshooting",
      preserveMaintenanceMetadata: true,
    });
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpEngineeringTroubleshootingGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-engineering-troubleshooting-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-status-tag")).toHaveTextContent("Admin internal");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last verified 2026-08-09");
    expect(screen.getByTestId("help-engineering-troubleshooting-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-sources-strip")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-runbook-overview")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-index")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-claim-discipline")).toBeInTheDocument();

    for (const heading of headings) {
      expect(heading.title).not.toMatch(/[*_`]/);
    }

    const actionPanel = screen.getByTestId("help-engineering-troubleshooting-action-panel");

    expect(
      within(actionPanel).getByTestId("help-engineering-troubleshooting-primary-cta"),
    ).toHaveAttribute(
      "href",
      ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.href,
    );

    const secondaryCtas = screen.getByTestId("help-engineering-troubleshooting-secondary-ctas");

    expect(
      within(secondaryCtas).getByRole("link", {
        name: ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.label,
      }),
    ).toHaveAttribute("href", ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCliUsage.href);

    const filter = screen.getByTestId("help-engineering-troubleshooting-symptom-filter");

    const symptomIndex = screen.getByTestId("help-engineering-troubleshooting-symptom-index");

    fireEvent.change(filter, { target: { value: "401" } });
    expect(within(symptomIndex).getAllByTestId("help-engineering-troubleshooting-symptom-row")).toHaveLength(1);
    expect(
      within(symptomIndex).getByRole("link", { name: "Configuration reference" }),
    ).toHaveAttribute("href", "/help/configuration-reference");

    fireEvent.change(filter, { target: { value: "no-such-symptom" } });
    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-empty")).toBeInTheDocument();

    expect(preparedMarkdown).not.toMatch(/\]\([^)]*architecture\/adrs\//i);
    expect(preparedMarkdown).not.toMatch(/\bTB-\d+\b/);
  });
});
