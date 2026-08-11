import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/dpa-template",
}));

import { HelpDpaTemplateGuideView } from "@/app/(operator)/help/_sections/HelpDpaTemplateGuideView";
import {
  DPA_TEMPLATE_HELP_DOWNLOAD_ACTION,
  DPA_TEMPLATE_HELP_OPEN_VARIABLES,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  DPA_TEMPLATE_HELP_PROVENANCE,
  formatDpaTemplateHelpProvenanceLine,
} from "@/lib/dpa-template-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { resolvePublicHelpTopicPdfHref } from "@/lib/product-documentation-pdf-href";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpDpaTemplateGuideView", () => {
  const loaded = tryLoadProductDocumentation("dpa-template");

  it("loads DPA template markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Data Processing Agreement (template)");
  });

  it("renders specialty diligence chrome with first-viewport key terms and corrected hierarchy", () => {
    if (loaded === null) {
      throw new Error("Expected dpa-template documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: loaded.entry.slug,
    });

    const { container } = render(
      <HelpDpaTemplateGuideView entry={loaded.entry} markdown={loaded.markdown} />,
    );

    const visible = (document.body.textContent ?? "").toLowerCase();
    const guide = screen.getByTestId("help-dpa-template-guide");
    const guideHtml = guide.innerHTML;

    expect(preparedMarkdown.toLowerCase()).not.toContain("start_here");
    expect(preparedMarkdown.toLowerCase()).not.toContain("security.md");
    expect(preparedMarkdown.toLowerCase()).not.toContain("architecture runs");
    expect(preparedMarkdown.toLowerCase()).toContain("architecture reviews");
    expect(visible).not.toContain("start_here");
    expect(visible).toContain("negotiation template");
    expect(visible).toContain("not a countersigned");
    expect(screen.getByTestId("help-dpa-template-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-dpa-template-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("help-dpa-template-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-dpa-template-full-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("help-dpa-template-key-terms")).toBeInTheDocument();
    expect(screen.queryByTestId("help-dpa-template-sources")).toBeNull();

    expect(visible).toContain("90 days");
    expect(visible).toContain("72 hours");

    for (const variable of DPA_TEMPLATE_HELP_OPEN_VARIABLES) {
      expect(visible).toContain(variable.toLowerCase());
    }

    const provenance = screen.getByTestId("help-dpa-template-provenance");
    expect(provenance.textContent).toContain(DPA_TEMPLATE_HELP_PROVENANCE.templateReviewDate);
    expect(provenance.textContent).toContain(DPA_TEMPLATE_HELP_PROVENANCE.sourceOfRecordPath);
    expect(provenance.textContent).toContain(formatDpaTemplateHelpProvenanceLine());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByTestId("help-dpa-template-status-tag")).toHaveTextContent("Template — not executed");

    expect(guideHtml).not.toMatch(/bg-teal-/);
    expect(guideHtml).not.toMatch(/bg-amber-/);

    const headerActions = screen.getByTestId("help-dpa-template-header-actions");
    expect(within(headerActions).getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(within(headerActions).getByTestId("help-dpa-template-download-pdf")).toBeInTheDocument();
    expect(headerActions.childElementCount).toBe(2);

    const downloadLink = screen.getByTestId("help-dpa-template-download-pdf");
    expect(downloadLink).toHaveAttribute("href", resolvePublicHelpTopicPdfHref(loaded.entry.slug));
    expect(downloadLink).toHaveTextContent(DPA_TEMPLATE_HELP_DOWNLOAD_ACTION.label);
    expect(downloadLink.className).toContain("bg-[var(--al-primary-action-bg)]");

    const actionPanel = screen.getByTestId("help-dpa-template-action-panel");
    expect(within(actionPanel).queryByTestId("help-dpa-template-primary-cta")).toBeNull();
    expect(
      within(actionPanel).getByRole("link", {
        name: DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.label,
      }),
    ).toHaveAttribute("href", DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href);
    expect(
      within(actionPanel).getByRole("link", {
        name: DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.label,
      }),
    ).toHaveAttribute("href", DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.href);
    expect(
      within(actionPanel).getByRole("link", {
        name: DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.label,
      }),
    ).toHaveAttribute("href", DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.href);

    const overview = screen.getByTestId("help-dpa-template-overview");
    expect(overview.className).toContain("text-[15px]");
    expect(overview.className).toContain("leading-6");
    expect(overview.className).toContain(HELP_PAGE_LAYOUT.readingBody);

    const contentColumn = overview.parentElement;
    expect(contentColumn?.className).toContain("max-w-[52rem]");

    expect(screen.getByTestId("help-dpa-template-claim-discipline").tagName).toBe("SECTION");

    const actionPanelLinks = within(actionPanel).getAllByRole("link");
    expect(actionPanelLinks).toHaveLength(3);
    for (const link of actionPanelLinks) {
      expect(link.className).not.toContain("bg-[var(--al-primary-action-bg)]");
    }

    const allPrimaryStyled = container.querySelectorAll('[class*="--al-primary-action-bg"]');
    expect(allPrimaryStyled).toHaveLength(1);

    expect(screen.queryByTestId("help-dpa-template-content")).toBeNull();
  });

  it("mounts the full DPA markdown body only after the disclosure opens", () => {
    if (loaded === null) {
      throw new Error("Expected dpa-template documentation to load.");
    }

    render(<HelpDpaTemplateGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByTestId("help-dpa-template-content")).toBeNull();

    const disclosure = screen.getByTestId("help-dpa-template-full-disclosure");
    expect(disclosure).toBeInstanceOf(HTMLDetailsElement);
    disclosure.open = true;
    fireEvent(disclosure, new Event("toggle", { bubbles: false }));

    expect(screen.getByTestId("help-dpa-template-content")).toBeInTheDocument();
  });
});
