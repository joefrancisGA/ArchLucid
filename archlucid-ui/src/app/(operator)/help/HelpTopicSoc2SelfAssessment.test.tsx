import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/soc2-self-assessment",
}));

import { HelpSoc2SelfAssessmentGuideView } from "@/app/(operator)/help/_sections/HelpSoc2SelfAssessmentGuideView";
import {
  SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
  SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS,
  SOC2_SELF_ASSESSMENT_HELP_SOURCES,
} from "@/lib/soc2-self-assessment-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpSoc2SelfAssessmentGuideView", () => {
  const loaded = tryLoadProductDocumentation("soc2-self-assessment");

  it("loads SOC2 self-assessment from security source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("SOC 2 self-assessment");
  });

  it("renders specialty diligence chrome without contributor leakage (TB-1746 / TB-1747)", () => {
    if (loaded === null) {
      throw new Error("Expected soc2-self-assessment documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "soc2-self-assessment",
    });

    render(<HelpSoc2SelfAssessmentGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("authsafetyguard");
    expect(preparedMarkdown.toLowerCase()).not.toContain("codeql");
    expect(preparedMarkdown.toLowerCase()).not.toContain("audit_coverage_matrix");
    expect(visible).toContain("self-assessment");
    expect(visible).toContain("not a soc 2 type i");
    expect(screen.getByTestId("help-soc2-self-assessment-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-soc2-self-assessment-claim-discipline")).toBeNull(); // TB-2092
    expect(screen.getByTestId("help-soc2-self-assessment-job-matrix")).toBeInTheDocument();
    expect(screen.getByTestId("help-soc2-self-assessment-page-title")).toHaveTextContent(
      SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
    );

    const actionPanel = screen.getByTestId("help-soc2-self-assessment-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openTrustCenter.label,
      }),
    ).toHaveAttribute("href", SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openTrustCenter.href);
    expect(
      within(actionPanel).getByRole("link", {
        name: SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openCaiqSig.label,
      }),
    ).toHaveAttribute("href", SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openCaiqSig.href);

    expect(screen.queryByTestId("help-soc2-self-assessment-sources")).toBeNull(); // TB-2092
    for (const link of SOC2_SELF_ASSESSMENT_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getAllByRole("link", { name: /caiq/i }).length).toBeGreaterThan(0);
  });

  it("renders SOC2 Type I roadmap without calendar commitments (TB-1748)", () => {
    if (loaded === null) {
      throw new Error("Expected soc2-self-assessment documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "soc2-self-assessment",
    });

    render(<HelpSoc2SelfAssessmentGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("2026-09-01");
    expect(preparedMarkdown.toLowerCase()).not.toContain("2026-q4");
    expect(visible).not.toContain("pending questions");
    expect(visible).toContain("illustrative");
  });
});
