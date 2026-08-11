import { fireEvent, render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({

  HelpTopicHashScroll: () => null,

}));



vi.mock("@/components/usability/PageContextualHelpButton", () => ({

  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,

}));



vi.mock("next/navigation", () => ({

  usePathname: () => "/help/engineering-troubleshooting",

}));



import { HelpEngineeringTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView";

import {

  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,

  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS,

} from "@/lib/engineering-troubleshooting-help-guide-content";

import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";

import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";

import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";



describe("HelpEngineeringTroubleshootingGuideView", () => {

  const loaded = tryLoadProductDocumentation("engineering-troubleshooting");



  it("loads engineering troubleshooting help from runbook sources", () => {

    expect(loaded).not.toBeNull();

    expect(loaded?.entry.slug).toBe("engineering-troubleshooting");

    expect(loaded?.entry.title).toBe("Engineering troubleshooting runbook");

    expect(loaded?.entry.lastReviewed).toBe("2026-08-09");

    expect(loaded?.entry.releaseApplicability).toBeTruthy();

  });



  it("renders Admin internal chrome, provenance, symptom lookup, and on-page primary action", () => {

    if (loaded === null) {

      throw new Error("Expected engineering-troubleshooting documentation to load.");

    }



    const sourcePath = loaded.entry.sourcePaths[0] ?? "";

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {

      helpTopicSlug: "engineering-troubleshooting",

      preserveMaintenanceMetadata: true,

    });

    const headings = extractHelpMarkdownHeadings(preparedMarkdown);



    render(<HelpEngineeringTroubleshootingGuideView entry={loaded.entry} markdown={loaded.markdown} />);



    expect(screen.getByTestId("help-engineering-troubleshooting-guide")).toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-status-tag")).toHaveTextContent("Admin internal");

    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    expect(screen.getByTestId("help-engineering-troubleshooting-sources")).toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-sources-strip")).toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-audience-strip")).toBeInTheDocument();

    expect(screen.queryByTestId("help-engineering-troubleshooting-orientation")).not.toBeInTheDocument();

    expect(screen.queryByTestId("help-engineering-troubleshooting-claim-discipline")).not.toBeInTheDocument();

    expect(screen.queryByTestId("help-engineering-troubleshooting-major-sections")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-runbook-overview")).toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-index")).toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-escalation")).toBeInTheDocument();

    expect(screen.getByTestId("help-engineering-troubleshooting-markdown-sections")).toBeInTheDocument();

    expect(screen.getByTestId("help-topic-toc-mobile")).toBeInTheDocument();



    for (const heading of headings) {

      expect(heading.title).not.toMatch(/[*_`]/);

    }



    const actionPanel = screen.getByTestId("help-engineering-troubleshooting-action-panel");



    expect(

      within(actionPanel).getByTestId("help-engineering-troubleshooting-primary-cta"),

    ).toHaveAttribute("href", ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.jumpToSymptomLookup.href);



    expect(screen.getAllByTestId("help-engineering-troubleshooting-primary-cta")).toHaveLength(1);



    const secondaryCtas = screen.getByTestId("help-engineering-troubleshooting-secondary-ctas");



    expect(

      within(secondaryCtas).getByRole("link", {

        name: ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.label,

      }),

    ).toHaveAttribute("href", ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.href);



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

    expect(within(symptomIndex).getByText("Request ID + auth mode")).toBeInTheDocument();

    fireEvent.change(filter, { target: { value: "" } });

    for (const row of ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS) {
      expect(within(symptomIndex).getByText(row.evidenceToAttach)).toBeInTheDocument();
    }

    fireEvent.change(filter, { target: { value: "no-such-symptom" } });

    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-empty")).toBeInTheDocument();

    expect(preparedMarkdown).not.toMatch(/\]\([^)]*architecture\/adrs\//i);

    expect(preparedMarkdown).not.toMatch(/\bTB-\d+\b/);

  });

});

