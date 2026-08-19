import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSubprocessorsGuideView } from "@/app/(operator)/help/_sections/HelpSubprocessorsGuideView";
import { getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_PRIMARY_ACTION,
  SUBPROCESSORS_HELP_REGISTER_STATUS_LABEL,
  SUBPROCESSORS_HELP_SOURCES,
} from "@/lib/subprocessors-help-evidence-copy";
import {
  SUBPROCESSORS_HELP_PAGE_TITLE,
  SUBPROCESSORS_HELP_PRIMARY_ACTIONS,
} from "@/lib/subprocessors-help-guide-content";
import {
  SUBPROCESSORS_HELP_RELATED_GUIDES,
  subprocessorsHelpRelatedGuides,
} from "@/lib/subprocessors-help-related-guides";

describe("HelpSubprocessorsGuideView", () => {
  const loaded = tryLoadProductDocumentation("subprocessors");

  function renderSubprocessorsPage(): void {
    if (loaded === null) {
      throw new Error("Expected subprocessors documentation to load.");
    }

    render(<HelpSubprocessorsGuideView entry={loaded.entry} markdown={loaded.markdown} />);
  }

  it("loads subprocessors documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Subprocessors");
    expect(loaded?.entry.lastReviewed).toBe("2026-07-25");
    expect(getHelpCenterTier(loaded!.entry)).toBe("product");
  });

  it("renders specialty register chrome with Trust primary CTA and single H1 (TB-1751, TB-1754)", () => {
    renderSubprocessorsPage();

    expect(screen.getByTestId("help-subprocessors-page-title")).toHaveTextContent(
      SUBPROCESSORS_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByTestId(SUBPROCESSORS_HELP_PRIMARY_ACTIONS.openTrustCenter.testId)).toHaveAttribute(
      "href",
      SUBPROCESSORS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByTestId("help-subprocessors-job-matrix-current")).toBeInTheDocument();
    expect(screen.getByTestId("help-subprocessors-guide")).toBeInTheDocument();
  });

  it("renders header metadata with reviewed date and canonical status tag", () => {
    renderSubprocessorsPage();

    expect(screen.getByTestId("help-subprocessors-header-status")).toHaveTextContent(
      SUBPROCESSORS_HELP_REGISTER_STATUS_LABEL,
    );
    expect(screen.getByTestId("help-subprocessors-header-metadata")).toHaveTextContent("2026-07-25");
  });

  it("renders orientation strip, diligence links, and Related budget without self-link", () => {
    renderSubprocessorsPage();

    expect(screen.getByTestId("subprocessors-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("subprocessors-help-claim-discipline")).toHaveTextContent(
      SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("button", { name: /print \/ save as pdf/i })).toBeInTheDocument();

    const sources = screen.getByTestId("subprocessors-help-sources");

    for (const link of SUBPROCESSORS_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    const related = subprocessorsHelpRelatedGuides();
    expect(related).toEqual([...SUBPROCESSORS_HELP_RELATED_GUIDES]);
    expect(related.length).toBeLessThanOrEqual(3);

    expect(
      screen
        .queryAllByRole("link", { name: /^subprocessors$/i })
        .filter((link) => link.getAttribute("href") === inAppHelpHref("subprocessors")),
    ).toHaveLength(0);
  });

  it("renders subprocessors help without contributor repo paths (TB-1752)", () => {
    if (loaded === null) {
      throw new Error("Expected subprocessors documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "subprocessors",
    });

    renderSubprocessorsPage();

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("start_here");
    expect(preparedMarkdown.toLowerCase()).not.toContain("infra/");
    expect(preparedMarkdown.toLowerCase()).not.toContain("terraform-azure");
    expect(visible).not.toContain("related documents");
    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /data processing agreement \(template\)/i }).length).toBeGreaterThan(0);
  });

  it("renders subprocessors help without contributor to-do or weak residency voice (TB-1755)", () => {
    if (loaded === null) {
      throw new Error("Expected subprocessors documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "subprocessors",
    });

    renderSubprocessorsPage();

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("update this table");
    expect(preparedMarkdown.toLowerCase()).not.toContain("product codebase");
    expect(visible).toContain("hosted archlucid saas");
    expect(visible).toContain("security diligence pack");
  });

  it("renders buyer-safe register vocabulary and currency statement", () => {
    renderSubprocessorsPage();

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(visible).not.toContain("run metadata");
    expect(visible).not.toContain("secrets by reference");
    expect(visible).not.toMatch(/\bblobs\b/);
    expect(visible).not.toMatch(/\bmanifests\b/);
    expect(visible).toContain("current as of 2026-07-25");
    expect(visible).not.toContain("contact your account team");
    expect(visible).toContain("2026-07-25");
    expect(visible).toContain("processing role");
    expect(visible).toContain("transfer safeguards");
  });
});
