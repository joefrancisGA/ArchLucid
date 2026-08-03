import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/dpa-template",
}));

import { HelpDpaTemplateGuideView } from "@/app/(operator)/help/_sections/HelpDpaTemplateGuideView";
import {
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  DPA_TEMPLATE_HELP_SOURCES,
} from "@/lib/dpa-template-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpDpaTemplateGuideView", () => {
  const loaded = tryLoadProductDocumentation("dpa-template");

  it("loads DPA template markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Data Processing Agreement (template)");
  });

  it("renders specialty diligence chrome with deferred full template (TB-1676 / TB-1678 / TB-1680)", () => {
    if (loaded === null) {
      throw new Error("Expected dpa-template documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: loaded.entry.slug,
    });

    render(<HelpDpaTemplateGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

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

    const actionPanel = screen.getByTestId("help-dpa-template-action-panel");

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

    const sources = screen.getByTestId("help-dpa-template-sources");

    for (const link of DPA_TEMPLATE_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getAllByRole("link", { name: /trust center/i }).length).toBeGreaterThan(0);
  });
});
