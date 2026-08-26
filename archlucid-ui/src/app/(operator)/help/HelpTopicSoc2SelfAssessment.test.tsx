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
import { expectClaimDisciplineBandContent } from "@/lib/claim-discipline-test-helpers";
import {
  SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE,
  SOC2_SELF_ASSESSMENT_HELP_PAGE_TITLE,
  SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS,
  SOC2_SELF_ASSESSMENT_HELP_SOURCES,
} from "@/lib/soc2-self-assessment-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
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
    expect(screen.getByTestId("help-soc2-self-assessment-claim-discipline-strip")).toHaveTextContent(
      SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-soc2-self-assessment",
      "help-soc2-self-assessment-claim-discipline",
      SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-soc2-self-assessment-claim-discipline")).not.toBeInTheDocument();
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

    expect(screen.getByTestId("help-soc2-self-assessment-header-metadata")).toHaveTextContent("2026-05-26");
    expect(screen.getByTestId("help-soc2-self-assessment-sources")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /caiq/i }).length).toBeGreaterThan(0);

    const sourcesSection = screen.getByTestId("help-soc2-self-assessment-sources");
    const sourceLinks = within(sourcesSection).getAllByRole("link");

    expect(sourceLinks.some((link) => link.getAttribute("href") === "/trust")).toBe(true);
    expect(sourceLinks.some((link) => link.getAttribute("href") === "/help/security-trust")).toBe(true);
    expect(sourceLinks.some((link) => link.getAttribute("href") === "/help/data-handling")).toBe(true);
    expect(
      sourceLinks.some((link) => link.getAttribute("href") === SOC2_SELF_ASSESSMENT_HELP_SOURCES[0]?.href),
    ).toBe(true);
    expect(
      sourceLinks.every((link) => link.getAttribute("href") !== "/help/soc2-self-assessment"),
    ).toBe(true);
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
