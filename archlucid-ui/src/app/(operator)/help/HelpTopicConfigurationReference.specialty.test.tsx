import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/configuration-reference",
}));

import { HelpConfigurationReferenceGuideView } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView";
import {
  CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS,
  CONFIGURATION_REFERENCE_HELP_SOURCES,
} from "@/lib/configuration-reference-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

/** TB-1330 — product presentation must not keep eng-library hrefs. */
const CONFIGURATION_REFERENCE_BANNED_HREF_FRAGMENTS = [
  "contributor-reference/",
  "architecture/adrs/",
  "scripts/",
  "../runbooks/",
  "runbooks/",
] as const;

describe("HelpConfigurationReferenceGuideView", () => {
  const loaded = tryLoadProductDocumentation("configuration-reference");

  it("loads configuration reference help from the library catalog source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("configuration-reference");
  });

  it("renders specialty Admin chrome with settings CTAs and collapsed catalog (TB-1326 / TB-1328)", () => {
    if (loaded === null) {
      throw new Error("Expected configuration-reference documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "configuration-reference",
    });

    render(<HelpConfigurationReferenceGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-configuration-reference-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-configuration-reference-task-sections")).toBeInTheDocument();
    expect(screen.getByTestId("help-configuration-reference-claim-discipline")).toBeInTheDocument();

    const appendix = screen.getByTestId("help-configuration-reference-catalog-appendix");

    expect(appendix.tagName.toLowerCase()).toBe("details");
    expect(appendix).not.toHaveAttribute("open");

    const actionPanel = screen.getByTestId("help-configuration-reference-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.label,
      }),
    ).toHaveAttribute("href", CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openSsoWizard.href);

    expect(
      within(actionPanel).getByRole("link", {
        name: CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.label,
      }),
    ).toHaveAttribute("href", CONFIGURATION_REFERENCE_HELP_PRIMARY_ACTIONS.openIdentityProviders.href);

    expect(
      within(actionPanel).queryByRole("link", {
        name: "API keys",
      }),
    ).toBeNull();

    expect(screen.queryByTestId("help-configuration-reference-sources")).toBeNull(); // TB-2092

    for (const banned of CONFIGURATION_REFERENCE_BANNED_HREF_FRAGMENTS) {
      expect(preparedMarkdown, `banned href fragment still present: ${banned}`).not.toContain(`](${banned}`);
      expect(preparedMarkdown, `banned href fragment still present: ${banned}`).not.toMatch(
        new RegExp(`\\]\\([^)]*${banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
      );
    }
  });
});
