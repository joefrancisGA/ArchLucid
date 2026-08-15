import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/choose-your-next-step",
}));

import { HelpPathChooserGuideView } from "@/app/(operator)/help/_sections/HelpPathChooserGuideView";
import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/path-chooser-help-guide-content";
import { PATH_CHOOSER_HELP_RELATED_NEXT_STEPS } from "@/lib/path-chooser-help-evidence-copy";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";

describe("HelpPathChooserGuideView", () => {
  const loaded = tryLoadProductDocumentation("choose-your-next-step");

  it("loads path-chooser help from buyer orientation source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Choose your next step");
  });

  it("renders specialty evaluator guide chrome for path-chooser (TB-1345 / TB-1711)", () => {
    if (loaded === null) {
      throw new Error("Expected path-chooser documentation to load.");
    }

    render(<HelpPathChooserGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-path-chooser-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-start-review")).toHaveAttribute(
      "href",
      PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href,
    );

    const sessionStrip = screen.getByTestId("help-path-chooser-evaluator-session");

    expect(sessionStrip).toBeInTheDocument();
    expect(PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS).toHaveLength(4);

    for (const [index, step] of PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS.entries()) {
      const row = screen.getByTestId(`help-path-chooser-evaluator-session-step-${index + 1}`);

      expect(row).toHaveTextContent(step.title);
      expect(within(row).getByRole("link", { name: step.action.label })).toHaveAttribute(
        "href",
        step.action.href,
      );
    }

    expect(screen.getByTestId("help-path-chooser-reference-appendix")).toBeInTheDocument();
    expect(resolveHelpTopicPermanentRedirect("evaluator-workbook")).toBeNull();
  });

  it("renders specialty chooser chrome without GTM/runbook repo paths (TB-1711 / TB-1712)", () => {
    if (loaded === null) {
      throw new Error("Expected path-chooser documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "choose-your-next-step",
    });

    render(<HelpPathChooserGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("v1_deferred");
    expect(preparedMarkdown.toLowerCase()).not.toContain("artifacts/");
    expect(preparedMarkdown.toLowerCase()).not.toContain("choose your next step");
    expect(visible).toContain("choose your next step");
    expect(screen.getByTestId("help-path-chooser-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-related-next-steps")).toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-related-next-steps-links")).toBeInTheDocument();
    expect(screen.queryByText(/^Fallback:/i)).toBeNull();

    const actionPanel = screen.getByTestId("help-path-chooser-action-panel");

    expect(
      within(actionPanel).getByRole("link", { name: PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.label }),
    ).toHaveAttribute("href", PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href);
    expect(
      within(actionPanel).getByRole("link", { name: PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.label }),
    ).toHaveAttribute("href", PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.href);

    for (const branch of PATH_CHOOSER_HELP_BRANCHES) {
      const branchCard = screen.getByTestId(`help-path-chooser-branch-${branch.id}`);
      expect(branchCard).toBeInTheDocument();
      expect(within(branchCard).getByRole("link", { name: branch.primary.label })).toHaveAttribute(
        "href",
        branch.primary.href,
      );
      expect(within(branchCard).getByRole("link", { name: branch.fallback.label })).toHaveAttribute(
        "href",
        branch.fallback.href,
      );
    }

    const evaluateBranch = PATH_CHOOSER_HELP_BRANCHES.find((branch) => branch.id === "evaluate");

    expect(evaluateBranch?.fallback.href).toBe("/help/first-architecture-review");
    expect(evaluateBranch?.fallback.label).toBe("Your first architecture review");
    expect(screen.queryByRole("link", { name: "Pilot guide" })).toBeNull();

    const relatedNextSteps = screen.getByTestId("help-path-chooser-related-next-steps-links");

    for (const link of PATH_CHOOSER_HELP_RELATED_NEXT_STEPS) {
      expect(within(relatedNextSteps).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
  });
});
