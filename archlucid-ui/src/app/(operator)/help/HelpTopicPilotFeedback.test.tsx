import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectClaimDisciplineBand } from "@/lib/claim-discipline-test-helpers";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/pilot-feedback",
}));

import { HelpPilotFeedbackGuideView } from "@/app/(operator)/help/_sections/HelpPilotFeedbackGuideView";
import {
  PILOT_FEEDBACK_HELP_PAGE_TITLE,
  PILOT_FEEDBACK_HELP_PRIMARY_ACTION,
  PILOT_FEEDBACK_HELP_WORKFLOW_STEPS,
} from "@/lib/pilot-feedback-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPilotFeedbackGuideView", () => {
  const loaded = tryLoadProductDocumentation("pilot-feedback");

  it("loads pilot-feedback help from product learning source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Pilot feedback (internal runbook)");
  });

  it("renders specialty admin chrome without API/SQL leakage (TB-1716 / TB-1717 / TB-1718)", () => {
    if (loaded === null) {
      throw new Error("Expected pilot-feedback documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "pilot-feedback",
    });

    render(<HelpPilotFeedbackGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("productlearningpilotsignals");
    expect(preparedMarkdown.toLowerCase()).not.toContain("storageprovider");
    expect(preparedMarkdown.toLowerCase()).not.toContain("/v1/product-learning");
    expect(visible).toContain("trusted");
    expect(visible).not.toContain("storageprovider");
    expect(visible).not.toContain("58r");
    expect(screen.getByTestId("help-pilot-feedback-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expectClaimDisciplineBand(screen, "help-pilot-feedback-claim-discipline".slice(0, -"-claim-discipline".length), "help-pilot-feedback-claim-discipline");
    expect(screen.getByTestId("help-pilot-feedback-job-matrix")).toBeInTheDocument();
    expect(screen.getByTestId("help-pilot-feedback-workflow-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-pilot-feedback-page-title")).toHaveTextContent(
      PILOT_FEEDBACK_HELP_PAGE_TITLE,
    );

    const actionPanel = screen.getByTestId("help-pilot-feedback-action-panel");

    expect(
      within(actionPanel).getAllByRole("link", {
        name: PILOT_FEEDBACK_HELP_PRIMARY_ACTION.label,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      within(actionPanel).getAllByRole("link", {
        name: PILOT_FEEDBACK_HELP_PRIMARY_ACTION.label,
      })[0],
    ).toHaveAttribute("href", PILOT_FEEDBACK_HELP_PRIMARY_ACTION.href);

    for (const step of PILOT_FEEDBACK_HELP_WORKFLOW_STEPS) {
      expect(visible).toContain(step.toLowerCase());
    }

    expect(screen.getAllByRole("link", { name: /pilot guide/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /recommendation learning/i }).length).toBeGreaterThan(0);
  });
});
