import { fireEvent, render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/engineering-troubleshooting",
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpEngineeringTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView";
import { HelpEngineeringTroubleshootingMarkdownSections } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingMarkdownSections";

import {
  ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,
  ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { expectClaimDisciplineBandContent } from "@/lib/claim-discipline-test-helpers";

import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";

import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";

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
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-status-tag")).toHaveTextContent("Admin internal");
    expect(screen.getByTestId("help-engineering-troubleshooting-applicability")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-provenance-footer")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("help-engineering-troubleshooting-runbook-source-paths")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-sources-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("help-engineering-troubleshooting-audience-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-engineering-troubleshooting-orientation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-engineering-troubleshooting-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-claim-discipline-strip")).toHaveTextContent(
      ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-engineering-troubleshooting",
      "help-engineering-troubleshooting-claim-discipline",
      ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    expect(screen.queryByTestId("help-engineering-troubleshooting-major-sections")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-runbook-overview")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-index")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-filter-hint")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-escalation")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-job-matrix")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-job-matrix-current")).toHaveTextContent(
      "Engineering troubleshooting runbook",
    );
    expect(screen.getByTestId("help-engineering-troubleshooting-related-help")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-markdown-sections")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc-mobile")).toBeInTheDocument();
    expect(screen.queryByText("Before sponsor send")).not.toBeInTheDocument();

    for (const heading of headings) {
      expect(heading.title).not.toMatch(/[*_`]/);
    }

    const actionPanel = screen.getByTestId("help-engineering-troubleshooting-action-panel");
    const claimStrip = screen.getByTestId("help-engineering-troubleshooting-claim-discipline-strip");

    expect(claimStrip.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.className).not.toMatch(/bg-teal-/);

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

    const related = screen.getByTestId("help-engineering-troubleshooting-related-help");
    const troubleshootingLink = within(related).getByRole("link", { name: /troubleshooting/i });

    expect(troubleshootingLink.getAttribute("href")).toContain("returnTo=%2Fhelp%2Fengineering-troubleshooting");

    const filter = screen.getByTestId("help-engineering-troubleshooting-symptom-filter");
    const symptomIndex = screen.getByTestId("help-engineering-troubleshooting-symptom-index");

    fireEvent.change(filter, { target: { value: "401" } });
    expect(within(symptomIndex).getAllByTestId("help-engineering-troubleshooting-symptom-row")).toHaveLength(1);
    expect(
      within(symptomIndex).getByRole("link", { name: "Identity providers" }),
    ).toHaveAttribute("href", "/administration/identity-providers");
    expect(within(symptomIndex).getByText("Request ID + auth mode")).toBeInTheDocument();

    const symptomRunbookLink = within(symptomIndex).getByRole("link", { name: /401 \/ 403 on API/i });
    fireEvent.click(symptomRunbookLink);
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("helpEngineeringTroubleshootingMarkdownSectionKey=3-401-unauthorized-everywhere"),
    );
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("#3-401-unauthorized-everywhere"));

    fireEvent.change(filter, { target: { value: "" } });
    for (const row of ENGINEERING_TROUBLESHOOTING_HELP_SYMPTOM_ROWS) {
      expect(within(symptomIndex).getByText(row.evidenceToAttach)).toBeInTheDocument();
    }

    expect(within(symptomIndex).getByText(/sealed review record status/i)).toBeInTheDocument();

    fireEvent.change(filter, { target: { value: "no-such-symptom" } });
    expect(screen.getByTestId("help-engineering-troubleshooting-symptom-empty")).toBeInTheDocument();
    expect(preparedMarkdown).not.toMatch(/\]\([^)]*architecture\/adrs\//i);
    expect(preparedMarkdown).not.toMatch(/\bTB-\d+\b/);
  });

  it("shows markdown error recovery when runbook body is empty", () => {
    if (loaded === null) {
      throw new Error("Expected engineering-troubleshooting documentation to load.");
    }

    render(
      <HelpEngineeringTroubleshootingMarkdownSections
        markdown=""
        sourceDocPath={loaded.entry.sourcePaths[0] ?? ""}
        helpTopicSlug={loaded.entry.slug}
      />,
    );

    expect(screen.getByTestId("help-engineering-troubleshooting-markdown-error")).toBeInTheDocument();
    expect(screen.getByTestId("help-engineering-troubleshooting-markdown-retry")).toBeInTheDocument();
  });
});
