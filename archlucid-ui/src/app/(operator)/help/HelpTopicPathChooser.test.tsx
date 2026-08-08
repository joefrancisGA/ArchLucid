import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/path-chooser",
}));

import { HelpPathChooserGuideView } from "@/app/(operator)/help/_sections/HelpPathChooserGuideView";
import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
  PATH_CHOOSER_HELP_SOURCES,
} from "@/lib/path-chooser-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPathChooserGuideView", () => {
  const loaded = tryLoadProductDocumentation("path-chooser");

  it("loads path-chooser help from buyer orientation source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Choose your next step");
  });

  it("renders specialty chooser chrome without GTM/runbook repo paths (TB-1711 / TB-1712)", () => {
    if (loaded === null) {
      throw new Error("Expected path-chooser documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "path-chooser",
    });

    render(<HelpPathChooserGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("v1_deferred");
    expect(preparedMarkdown.toLowerCase()).not.toContain("artifacts/");
    expect(visible).toContain("choose your next step");
    expect(screen.getByTestId("help-path-chooser-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-path-chooser-claim-discipline")).toBeNull(); // TB-2092
    const actionPanel = screen.getByTestId("help-path-chooser-action-panel");

    expect(
      within(actionPanel).getByRole("link", { name: PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.label }),
    ).toHaveAttribute("href", PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href);
    expect(
      within(actionPanel).getByRole("link", { name: PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.label }),
    ).toHaveAttribute("href", PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.href);

    for (const branch of PATH_CHOOSER_HELP_BRANCHES) {
      expect(screen.getByTestId(`help-path-chooser-branch-${branch.id}`)).toBeInTheDocument();
    }

    expect(screen.queryByTestId("help-path-chooser-sources")).toBeNull(); // TB-2092
    for (const link of PATH_CHOOSER_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
  });
});
